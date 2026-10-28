; MediSync Installer Script for Inno Setup
; Compile this with Inno Setup Compiler

#define MyAppName "MediSync"
#define MyAppVersion "1.0"
#define MyAppPublisher "MediSync Healthcare"
#define MyAppURL "https://medisync.com"
#define MyAppExeName "start-medisync.bat"

[Setup]
AppId={{A8B9C0D1-E2F3-4567-8901-ABCDEF123456}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=LICENSE.txt
OutputDir=installer-output
OutputBaseFilename=MediSync-Setup-v{#MyAppVersion}
; SetupIconFile=..\public\favicon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
MinVersion=10.0

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "autostart"; Description: "Windows başlangıcında otomatik çalıştır"; GroupDescription: "Ek seçenekler:"

[Files]
; Application files
Source: "..\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\components\*"; DestDir: "{app}\components"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\contexts\*"; DestDir: "{app}\contexts"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\lib\*"; DestDir: "{app}\lib"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\prisma\*"; DestDir: "{app}\prisma"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\tools\*"; DestDir: "{app}\tools"; Flags: ignoreversion recursesubdirs createallsubdirs

; Config files
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\package-lock.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\next.config.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\tsconfig.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\tailwind.config.ts"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\postcss.config.js"; DestDir: "{app}"; Flags: ignoreversion

; Configuration Templates
Source: "env.template"; DestDir: "{app}"; DestName: ".env"; Flags: ignoreversion

; Runtime files (Node.js portable)
; NOTE: User must place node-vxx-win-x64 content into installer\runtime\nodejs
Source: "runtime\nodejs\*"; DestDir: "{app}\runtime\nodejs"; Flags: ignoreversion recursesubdirs createallsubdirs

; PostgreSQL portable
; NOTE: User must place pgsql content into installer\runtime\pgsql
Source: "runtime\pgsql\*"; DestDir: "{app}\runtime\pgsql"; Flags: ignoreversion recursesubdirs createallsubdirs

; Batch scripts (Located in the same directory as this .iss file)
Source: "start-medisync.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "stop-medisync.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "init-database.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\MediSync'i Durdur"; Filename: "{app}\stop-medisync.bat"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "MediSync"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue; Tasks: autostart

[Run]
Filename: "{app}\init-database.bat"; StatusMsg: "Veritabanı oluşturuluyor..."; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent shellexec

[UninstallRun]
Filename: "{app}\stop-medisync.bat"; Flags: runhidden waituntilterminated

[Code]
var
  PasswordPage: TInputQueryWizardPage;
  PortPage: TInputQueryWizardPage;

procedure InitializeWizard;
begin
  // Database password page
  PasswordPage := CreateInputQueryPage(wpSelectDir,
    'Veritabanı Ayarları', 'PostgreSQL için şifre belirleyin',
    'Veritabanı için güvenli bir şifre belirleyin:');
  PasswordPage.Add('Şifre:', True);
  PasswordPage.Values[0] := 'MediSync2024!';

  // Port configuration page  
  PortPage := CreateInputQueryPage(PasswordPage.ID,
    'Port Ayarları', 'Uygulama portlarını belirleyin',
    'Varsayılan portları kullanabilir veya değiştirebilirsiniz:');
  PortPage.Add('Web Port (varsayılan: 3000):', False);
  PortPage.Add('PostgreSQL Port (varsayılan: 5432):', False);
  PortPage.Values[0] := '3000';
  PortPage.Values[1] := '5432';
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  EnvFile: String;
  EnvContent: TStringList;
  ContentStr: String;
begin
  if CurStep = ssPostInstall then
  begin
    // Update .env file with user settings
    EnvFile := ExpandConstant('{app}\.env');
    EnvContent := TStringList.Create;
    try
      if FileExists(EnvFile) then
      begin
        EnvContent.LoadFromFile(EnvFile);
        ContentStr := EnvContent.Text;
        
        StringChange(ContentStr, '{{DB_PASSWORD}}', PasswordPage.Values[0]);
        StringChange(ContentStr, '{{WEB_PORT}}', PortPage.Values[0]);
        StringChange(ContentStr, '{{DB_PORT}}', PortPage.Values[1]);
        
        EnvContent.Text := ContentStr;
        EnvContent.SaveToFile(EnvFile);
      end;
    finally
      EnvContent.Free;
    end;
  end;
end;
