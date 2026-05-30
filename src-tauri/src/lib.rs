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

#[cfg(test)]
mod tests {
  use super::*;
  use std::time::{SystemTime, UNIX_EPOCH};

  fn unique_test_key(label: &str) -> String {
    let nanos = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .expect("system clock is before unix epoch")
      .as_nanos();
    format!("speakright-test-{label}-{nanos}")
  }

  #[test]
  fn secure_store_rejects_blank_keys() {
    let result = secure_store_set("  ".to_string(), "secret".to_string());

    assert!(result.is_err());
    assert_eq!(
      result.expect_err("blank secure store key should fail"),
      "secure store key must not be empty"
    );
  }

  #[test]
  fn secure_store_roundtrips_through_platform_keychain() {
    let key = unique_test_key("roundtrip");
    let value = r#"{"apiKey":"desktop-secret","region":"eastus"}"#.to_string();

    secure_store_delete(key.clone()).expect("pre-test cleanup should succeed");
    secure_store_set(key.clone(), value.clone()).expect("set should succeed");

    let stored = secure_store_get(key.clone()).expect("get should succeed");
    assert_eq!(stored, Some(value));

    secure_store_delete(key.clone()).expect("delete should succeed");
    let deleted = secure_store_get(key).expect("get after delete should succeed");
    assert_eq!(deleted, None);
  }
}
