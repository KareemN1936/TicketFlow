using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using TicketFlow.API.Dtos;

namespace TicketFlow.API.Services;

public interface IAiTicketService
{
    bool IsConfigured { get; }
    Task<AiSuggestionResponse> SuggestAsync(AiTicketTextRequest request, IReadOnlyList<(int Id, string Name)> choices, string kind, CancellationToken cancellationToken);
    Task<AiTextResponse> CompleteAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken);
}

public class AiTicketService : IAiTicketService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiTicketService> _logger;
    private string Provider => (Environment.GetEnvironmentVariable("AI_PROVIDER") ?? _configuration["AI_PROVIDER"] ?? "openai").Trim().ToLowerInvariant();
    private string? ApiKey => Provider switch
    {
        "groq" => Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? _configuration["GROQ_API_KEY"],
        "openai" => Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? _configuration["OPENAI_API_KEY"],
        _ => null
    };
    private string Model => Provider switch
    {
        "groq" => Environment.GetEnvironmentVariable("GROQ_MODEL") ?? _configuration["GROQ_MODEL"] ?? "llama-3.1-8b-instant",
        _ => Environment.GetEnvironmentVariable("OPENAI_MODEL") ?? _configuration["OPENAI_MODEL"] ?? "gpt-4.1-mini"
    };
    private string Endpoint => Provider switch
    {
        "groq" => "https://api.groq.com/openai/v1/chat/completions",
        _ => "https://api.openai.com/v1/chat/completions"
    };

    public AiTicketService(HttpClient httpClient, IConfiguration configuration, ILogger<AiTicketService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsConfigured => Provider is "openai" or "groq" && !string.IsNullOrWhiteSpace(ApiKey);

    public async Task<AiSuggestionResponse> SuggestAsync(AiTicketTextRequest request, IReadOnlyList<(int Id, string Name)> choices, string kind, CancellationToken cancellationToken)
    {
        if (!IsConfigured) return new() { IsConfigured = false, Reason = "AI is not configured yet." };
        var allowed = string.Join(", ", choices.Select(x => $"{x.Id}:{x.Name}"));
        var system = $"You classify IT help desk tickets. Select exactly one existing {kind} from: {allowed}. Return only JSON with suggestedId, suggestedName, confidence (0-1), reason. Never invent a choice.";
        if (kind == "priority") system += " Treat server down, system unavailable, security issue, all users affected, and production outage as high or critical when such a choice exists.";
        var raw = await SendAsync(system, $"Title: {request.Title}\nDescription: {request.Description}", true, cancellationToken);
        try
        {
            using var json = JsonDocument.Parse(raw);
            var root = json.RootElement;
            var id = root.GetProperty("suggestedId").GetInt32();
            var selected = choices.FirstOrDefault(x => x.Id == id);
            if (selected == default) throw new JsonException("AI returned a choice outside the allowed list.");
            return new() { SuggestedId = selected.Id, SuggestedName = selected.Name, Confidence = root.GetProperty("confidence").GetDouble(), Reason = root.GetProperty("reason").GetString() ?? string.Empty };
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException)
        {
            _logger.LogWarning(ex, "Could not parse AI {Kind} suggestion", kind);
            return new() { Reason = "AI returned an invalid suggestion. Please try again." };
        }
    }

    public async Task<AiTextResponse> CompleteAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken)
    {
        if (!IsConfigured) return new() { IsConfigured = false, Content = "AI is not configured yet. Ask an administrator to set the AI environment variables." };
        return new() { Content = await SendAsync(systemPrompt, userPrompt, false, cancellationToken) };
    }

    private async Task<string> SendAsync(string systemPrompt, string userPrompt, bool jsonMode, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", ApiKey);
        var payload = new Dictionary<string, object>
        {
            ["model"] = Model,
            ["temperature"] = 0.2,
            ["messages"] = new[] { new { role = "system", content = systemPrompt }, new { role = "user", content = userPrompt } }
        };
        if (jsonMode) payload["response_format"] = new { type = "json_object" };
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("AI provider {Provider} returned status {StatusCode}", Provider, response.StatusCode);
            throw new HttpRequestException("The AI provider is temporarily unavailable.", null, response.StatusCode);
        }
        using var json = JsonDocument.Parse(body);
        return json.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
    }
}
