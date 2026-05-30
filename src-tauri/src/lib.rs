use keyring::{Entry, Error as KeyringError};

const SECURE_STORE_SERVICE: &str = "com.speakright.desktop";

fn secure_entry(key: &str) -> Result<Entry, String> {
  if key.trim().is_empty() {
    return Err("secure store key must not be empty".to_string());
  }
  Entry::new(SECURE_STORE_SERVICE, key).map_err(|error| error.to_string())
}

#[tauri::command]
fn secure_store_get(key: String) -> Result<Option<String>, String> {
  let entry = secure_entry(&key)?;
  match entry.get_password() {
    Ok(value) => Ok(Some(value)),
    Err(KeyringError::NoEntry) => Ok(None),
    Err(error) => Err(error.to_string()),
  }
}

#[tauri::command]
fn secure_store_set(key: String, value: String) -> Result<(), String> {
  secure_entry(&key)?
    .set_password(&value)
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn secure_store_delete(key: String) -> Result<(), String> {
  let entry = secure_entry(&key)?;
  match entry.delete_credential() {
    Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
    Err(error) => Err(error.to_string()),
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .invoke_handler(tauri::generate_handler![
      secure_store_get,
      secure_store_set,
      secure_store_delete
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
