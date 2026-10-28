; MediSync v1.5.0 - Profesyonel Biyomedikal Cihaz ve Ekipman Yönetim Sistemi
; Inno Setup Derleyici Betiği (https://jrsoftware.org/isdl.php)

#define MyAppName "MediSync"
#define MyAppVersion "1.5.0"
#define MyAppPublisher "MediSync Biyomedikal Sistemleri"
#define MyAppURL "http://localhost:3000"
#define MyAppExeName "BASLAT.bat"

[Setup]
AppId={{8E3D2A82-E025-471C-B423-9D8BD5FB2281}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion} (Hastane Yerel Sürüm)
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName=C:\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\output
OutputBaseFilename=MediSync_Setup_v{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
MinVersion=10.0
PrivilegesRequired=admin
WizardStyle=modern

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Masaüstü kısayolu oluştur"; GroupDescription: "Ek görevler:"; Flags: checkablealone
Name: "firewallrule"; Description: "Hastane ağı erişimi için Güvenlik Duvarında 3000 portunu aç"; GroupDescription: "Ağ Ayarları:"; Flags: checkablealone

[Files]
; Tüm proje dosyaları (node_modules ve .next hariç)
Source: "..\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules\*,.next\*,output\*,*.log,.git\*"

[Icons]
Name: "{group}\{#MyAppName} Başlat"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{#MyAppName} Güvenlik Duvarı İzni"; Filename: "{app}\GUVENLIK_DUVARI_AYARLA.bat"
Name: "{group}\{#MyAppName} Otomatik Başlatma Kur"; Filename: "{app}\OTOMATIK_BASLAT_KUR.bat"
Name: "{group}\{#MyAppName} Veritabanı Yedekle"; Filename: "{app}\YEDEKLE.bat"
Name: "{group}\{#MyAppName} İlk Kurulum Sihirbazı"; Filename: "{app}\KURULUM.bat"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Güvenlik duvarı kuralını ekle
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""MediSync Tibbi Cihaz Port 3000"" dir=in action=allow protocol=TCP localport=3000 profile=any"; StatusMsg: "Hastane ağı için güvenlik duvarı yapılandırılıyor..."; Tasks: firewallrule; Flags: runhidden
; Kurulum sonrası bağımlılık ve veritabanı hazırlığı
Filename: "{app}\KURULUM.bat"; Description: "Bağımlılıkları yükle ve veritabanını hazırla"; Flags: nowait postinstall skipifsilent shellexec

[Code]
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  
  // Node.js kurulu mu kontrol et
  if not Exec('cmd.exe', '/c where node', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    if MsgBox('DİKKAT: Node.js kurulu değil!'#13#10#13#10 +
              'MediSync çalışması için Node.js 18+ gereklidir.'#13#10 +
              'Lütfen https://nodejs.org adresinden LTS sürümünü kurun.'#13#10#13#10 +
              'Yine de devam etmek istiyor musunuz?',
              mbConfirmation, MB_YESNO) = IDNO then
    begin
      Result := False;
    end;
  end;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpReady then
  begin
    MsgBox('ÖNEMLİ BİLGİLENDİRME:'#13#10#13#10 +
           'MediSync yerel PostgreSQL veritabanı ile çalışır.'#13#10 +
           'Eğer PostgreSQL kurulu değilse https://www.postgresql.org/download/ adresinden kurun.'#13#10#13#10 +
           'Kurulum tamamlandığında tarayıcınızda http://localhost:3000 açılacaktır.',
           mbInformation, MB_OK);
  end;
end;
