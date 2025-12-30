; MediSync Version 1 - Inno Setup Script
; Bu dosya ile Windows installer oluşturabilirsiniz
; Inno Setup'ı indirin: https://jrsoftware.org/isdl.php

#define MyAppName "MediSync"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "MediSync"
#define MyAppURL "http://localhost:3000"
#define MyAppExeName "BASLAT.bat"

[Setup]
; Benzersiz uygulama kimliği (GUID oluşturucu kullanarak değiştirin)
AppId={{8E3D2A82-E025-471C-B423-9D8BD5FB2281}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} Version {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName=C:\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
; Çıktı dizini
OutputDir=..\output
OutputBaseFilename=MediSync_Setup_v{#MyAppVersion}
; Sıkıştırma ayarları
Compression=lzma2/ultra64
SolidCompression=yes
; Windows 10+ gereksinimi
MinVersion=10.0
; Yönetici hakları gerekli
PrivilegesRequired=admin
; Modern görünüm
WizardStyle=modern
; İkon (varsa)
; SetupIconFile=..\public\icon.ico

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Masaüstü kısayolu oluştur"; GroupDescription: "Ek görevler:"; Flags: unchecked
Name: "quicklaunchicon"; Description: "Hızlı Başlat kısayolu oluştur"; GroupDescription: "Ek görevler:"; Flags: unchecked

[Files]
; Tüm proje dosyaları (node_modules ve .next hariç)
Source: "..\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules\*,.next\*,output\*,*.log,.git\*"
; NOT: Kullanıcı kurulum sonrası KURULUM.bat çalıştırmalıdır

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{#MyAppName} Kurulum"; Filename: "{app}\KURULUM.bat"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Kurulum sonrası otomatik olarak KURULUM.bat çalıştır
Filename: "{app}\KURULUM.bat"; Description: "Bağımlılıkları yükle ve veritabanını hazırla"; Flags: nowait postinstall skipifsilent shellexec

[Code]
// Node.js kontrolü
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  
  // Node.js kurulu mu kontrol et
  if not Exec('cmd.exe', '/c where node', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    if MsgBox('Node.js kurulu değil!'#13#10#13#10 +
              'MediSync çalışması için Node.js gereklidir.'#13#10 +
              'https://nodejs.org adresinden Node.js LTS sürümünü indirip kurun.'#13#10#13#10 +
              'Yine de kuruluma devam etmek ister misiniz?',
              mbConfirmation, MB_YESNO) = IDNO then
    begin
      Result := False;
    end;
  end;
end;

// PostgreSQL uyarısı
procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpReady then
  begin
    MsgBox('ÖNEMLİ: MediSync PostgreSQL veritabanı gerektirir.'#13#10#13#10 +
           'Eğer PostgreSQL kurulu değilse:'#13#10 +
           '1. https://www.postgresql.org/download/ adresinden indirin'#13#10 +
           '2. Kurulum sırasında şifre belirleyin'#13#10#13#10 +
           'Kurulum sonrası:'#13#10 +
           '- Tarayıcıda http://localhost:3000/setup adresine gidin'#13#10 +
           '- Kurulum sihirbazı ile veritabanı yapılandırmasını tamamlayın',
           mbInformation, MB_OK);
  end;
end;

[Messages]
turkish.WelcomeLabel1=MediSync Kurulum Sihirbazına Hoş Geldiniz
turkish.WelcomeLabel2=Bu sihirbaz MediSync Version 1 - Profesyonel Tıbbi Cihaz Yönetim Sistemi kurulumunda size rehberlik edecektir.
