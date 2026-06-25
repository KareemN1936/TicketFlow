using TicketFlow.API.Data;
using TicketFlow.API.Helpers;
using TicketFlow.API.Hubs;
using TicketFlow.API.Models;
using TicketFlow.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

LoadEnvironmentFile();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromMinutes(15);
});

builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddHttpClient<IAiTicketService, AiTicketService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var secretKey = builder.Configuration["JwtSettings:SecretKey"];
var issuer = builder.Configuration["JwtSettings:Issuer"];
var audience = builder.Configuration["JwtSettings:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
        NameClaimType = System.Security.Claims.ClaimTypes.Name,
        RoleClaimType = System.Security.Claims.ClaimTypes.Role
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken)
                && path.StartsWithSegments("/hubs/notifications"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TicketFlow API",
        Version = "v1"
    });

    var bearerScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token only. Do not type Bearer before it."
    };

    options.AddSecurityDefinition("Bearer", bearerScheme);

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document, null),
            new List<string>()
        }
    });
});

var app = builder.Build();

await ApplyMigrationsAsync(app);
await SeedRolesAsync(app);
await SeedPhase5RoleAccountsAsync(app);
await SeedAdminUserAsync(app);
await SeedTestUserAsync(app);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("ReactPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

static void LoadEnvironmentFile()
{
    var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
    if (!File.Exists(envPath)) return;

    foreach (var rawLine in File.ReadAllLines(envPath))
    {
        var line = rawLine.Trim();
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#')) continue;

        var separatorIndex = line.IndexOf('=');
        if (separatorIndex <= 0) continue;

        var name = line[..separatorIndex].Trim();
        var value = line[(separatorIndex + 1)..].Trim().Trim('"', '\'');

        // A real process-level environment variable takes precedence over .env.
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(name)))
        {
            Environment.SetEnvironmentVariable(name, value);
        }
    }
}

static async Task ApplyMigrationsAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();

    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
}

static async Task SeedRolesAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    string[] roles =
    {
        RoleNames.Admin,
        RoleNames.ITSupportAgent,
        RoleNames.Employee,
        RoleNames.Manager
    };

    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }
}

static async Task SeedTestUserAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    
    var testEmail = "test@example.com";
    var testUser = await userManager.FindByEmailAsync(testEmail);
    
    if (testUser == null)
    {
        var user = new ApplicationUser
        {
            FullName = "Test User",
            UserName = testEmail,
            Email = testEmail,
            EmailConfirmed = true
        };
        
        await userManager.CreateAsync(user, "TestPassword123!");
        await userManager.AddToRoleAsync(user, RoleNames.Employee);
    }
}

static async Task SeedPhase5RoleAccountsAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

    var accounts = new[]
    {
        new { Email = "admin@ticketflow.com", FullName = "TicketFlow Admin", Role = RoleNames.Admin },
        new { Email = "itsupportagent@ticketflow.com", FullName = "TicketFlow IT Support Agent", Role = RoleNames.ITSupportAgent },
        new { Email = "employee@ticketflow.com", FullName = "TicketFlow Employee", Role = RoleNames.Employee },
        new { Email = "manager@ticketflow.com", FullName = "TicketFlow Manager", Role = RoleNames.Manager }
    };

    foreach (var account in accounts)
    {
        var user = await userManager.FindByEmailAsync(account.Email);

        if (user == null)
        {
            user = new ApplicationUser
            {
                FullName = account.FullName,
                UserName = account.Email,
                Email = account.Email,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(user, "Password123.");

            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Could not seed {account.Email}: {string.Join(", ", createResult.Errors.Select(error => error.Description))}");
            }
        }
        else
        {
            user.FullName = account.FullName;
            user.UserName = account.Email;
            user.EmailConfirmed = true;

            var updateResult = await userManager.UpdateAsync(user);
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await userManager.ResetPasswordAsync(user, resetToken, "Password123.");

            if (!updateResult.Succeeded || !resetResult.Succeeded)
            {
                var errors = updateResult.Errors.Concat(resetResult.Errors).Select(error => error.Description);
                throw new InvalidOperationException($"Could not update {account.Email}: {string.Join(", ", errors)}");
            }
        }

        var currentRoles = await userManager.GetRolesAsync(user);
        var rolesToRemove = currentRoles.Where(role => role != account.Role).ToArray();

        if (rolesToRemove.Length > 0)
        {
            await userManager.RemoveFromRolesAsync(user, rolesToRemove);
        }

        if (!await userManager.IsInRoleAsync(user, account.Role))
        {
            await userManager.AddToRoleAsync(user, account.Role);
        }
    }
}

static async Task SeedAdminUserAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    const string adminEmail = "admin@test.com";
    const string adminPassword = "Admin123.";

    if (!await roleManager.RoleExistsAsync(RoleNames.Admin))
    {
        await roleManager.CreateAsync(new IdentityRole(RoleNames.Admin));
    }

    var adminUser = await userManager.FindByEmailAsync(adminEmail);

    if (adminUser == null)
    {
        adminUser = new ApplicationUser
        {
            FullName = "Admin",
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(adminUser, adminPassword);

        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, RoleNames.Admin);
        }
        else
        {
            foreach (var error in result.Errors)
            {
                Console.WriteLine($"Admin seed error: {error.Description}");
            }
        }
    }
    else if (!await userManager.IsInRoleAsync(adminUser, RoleNames.Admin))
    {
        await userManager.AddToRoleAsync(adminUser, RoleNames.Admin);
    }
}
