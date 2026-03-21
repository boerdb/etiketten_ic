# Etiketten IC

## Brother QL-820NWB (Android Bluetooth) - known good setup

Deze app print labels op Android via Brother SDK met `@rdlabo/capacitor-brotherprint`.

### 1. Native Brother SDK AAR
Plaats het bestand hier:

- `android/BrotherPrintLibrary/BrotherPrintLibrary.aar`

### 2. Printer MAC-adres configureren
Stel het Bluetooth MAC-adres in op:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Veld:

- `brotherPrinterMacAddress`

### 3. Diagnoseblok tonen/verbergen
Veld:

- `showBrotherDiagnostics`

Aanbevolen:

- development: `true`
- production: `false`

### 4. Build en sync
Voer uit vanaf projectroot:

```powershell
npm run build
npx cap sync android
```

Android build:

```powershell
cd android
.\gradlew.bat :app:assembleDebug
```

### 5. Praktische testvolgorde
1. Koppel printer eerst via Android Bluetooth settings.
2. Open app en controleer runtime-status.
3. Gebruik (indien zichtbaar) diagnoseknoppen voor bereikbaarheid.
4. Print testlabel.

### Bekende werkende printerinstelling
- Model: Brother QL-820NWB
- Label: DK-22205 (RollW62)
- Printpad: Bluetooth via Brother SDK
