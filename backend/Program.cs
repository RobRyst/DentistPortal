using System.Security.Claims;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.OpenApi.Models;

using backend.Infrastructure.Data;
using backend.Domains.Entities;
using backend.Domains.Interfaces;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// ------------------ EF Core ------------------
var connection = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connection, ServerVersion.AutoDetect(connection)));

// ------------------ Identity ------------------
builder.Services.AddIdentityCore<AppUser>(options =>
{
    options.User.RequireUniqueEmail = true;

    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireDigit = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.Password.RequiredLength = 6;

    options.Lockout.AllowedForNewUsers = false;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddSignInManager<SignInManager<AppUser>>();

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// ------------------ Authentication (JWT) ------------------
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            ),
            NameClaimType = JwtRegisteredClaimNames.Sub,
            RoleClaimType = ClaimTypes.Role
        };
    });

// ------------------ Authorization ------------------
builder.Services.AddAuthorization();

// ------------------ App services ------------------
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<TokenService>();

builder.Services.AddHttpContextAccessor();

// ------------------ Mailtrap (Email via SMTP) ------------------
builder.Services.Configure<MailTrapOptions>(builder.Configuration.GetSection("MailtrapSmtp"));
builder.Services.AddScoped<IEmailSender, EmailService>();
builder.Services.AddScoped<TwoFactorAuthService>();
builder.Services.Configure<TwilioOptions>(builder.Configuration.GetSection("Twilio"));
builder.Services.AddHostedService<AppointmentReminderService>();

bool twilioConfigured =
    !string.IsNullOrWhiteSpace(builder.Configuration["Twilio:AccountSid"]) &&
    !string.IsNullOrWhiteSpace(builder.Configuration["Twilio:AuthToken"])  &&
    !string.IsNullOrWhiteSpace(builder.Configuration["Twilio:FromNumber"]);

if (twilioConfigured)
{
    builder.Services.AddHttpClient<ITextMessageService, TextMessageService>();
}
else
{
    builder.Services.AddSingleton<ITextMessageService, DevSmsSender>();
}


// ------------------ CORS ------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ------------------ Swagger & Controllers ------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "RystDentist API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference
            { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var osloNow = TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time"));
    static DateTime Day(DateTime date, int hour, int minutes) => new(date.Year, date.Month, date.Day, hour, minutes, 0, DateTimeKind.Local);

    var todayLocal = osloNow.Date;
    var blocks = new[]
    {
        (start: Day(todayLocal, 9, 0),  end: Day(todayLocal, 12, 0)),
        (start: Day(todayLocal, 13, 0), end: Day(todayLocal, 16, 0)),
        (start: Day(todayLocal.AddDays(1), 9, 0),  end: Day(todayLocal.AddDays(1), 12, 0)),
        (start: Day(todayLocal.AddDays(1), 13, 0), end: Day(todayLocal.AddDays(1), 16, 0)),
    };

    foreach (var (start, end) in blocks)
    {
        var startUtc = start.ToUniversalTime();
        var endUtc   = end.ToUniversalTime();

        bool exists = await db.AvailabilitySlots.AnyAsync(slot =>
            slot.ProviderId == 1 && slot.StartTime == startUtc && slot.EndTime == endUtc);
        if (!exists)
        {
            db.AvailabilitySlots.Add(new AvailabilitySlot
            {
                ProviderId = 1,
                StartTime = startUtc,
                EndTime = endUtc
            });
        }
    }
    await db.SaveChangesAsync();
}

// ------------------ Seed roles ------------------
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var normalizer  = scope.ServiceProvider.GetRequiredService<ILookupNormalizer>();

    var allUsers = await userManager.Users.ToListAsync();

    foreach (var user in allUsers)
    {
        if (string.IsNullOrWhiteSpace(user.UserName))
            user.UserName = user.Email ?? user.UserName ?? "";

        var normEmail = string.IsNullOrWhiteSpace(user.Email) ? null : normalizer.NormalizeEmail(user.Email);
        var normUser  = string.IsNullOrWhiteSpace(user.UserName) ? null : normalizer.NormalizeName(user.UserName);

        bool changed = false;
        if (user.NormalizedEmail != normEmail) { user.NormalizedEmail = normEmail; changed = true; }
        if (user.NormalizedUserName != normUser) { user.NormalizedUserName = normUser; changed = true; }

        if (changed)
        {
            var result = await userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                
            }
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("CorsPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
