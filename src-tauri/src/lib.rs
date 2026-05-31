use keyring::{Entry, Error as KeyringError};
use log::LevelFilter;
use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

const SECURE_STORE_SERVICE: &str = "com.speakright.desktop";
const LOG_FILE_NAME: &str = "speakright";
const LOG_MAX_FILE_SIZE_BYTES: u128 = 1_000_000;
const LOG_ARCHIVE_COUNT: usize = 5;

fn desktop_log_level() -> LevelFilter {
    if cfg!(debug_assertions) {
        LevelFilter::Debug
    } else {
        LevelFilter::Info
    }
}

fn secure_entry(key: &str) -> Result<Entry, String> {
    if key.trim().is_empty() {
        return Err("secure store key must not be empty".to_string());
    }
    Entry::new(SECURE_STORE_SERVICE, key).map_err(|error| {
        let message = error.to_string();
        log::warn!("secure credential store entry could not be opened: {message}");
        message
    })
}

#[tauri::command]
fn secure_store_get(key: String) -> Result<Option<String>, String> {
    let entry = secure_entry(&key)?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(KeyringError::NoEntry) => Ok(None),
        Err(error) => {
            let message = error.to_string();
            log::warn!("secure credential read failed: {message}");
            Err(message)
        }
    }
}

#[tauri::command]
fn secure_store_set(key: String, value: String) -> Result<(), String> {
    secure_entry(&key)?.set_password(&value).map_err(|error| {
        let message = error.to_string();
        log::warn!("secure credential write failed: {message}");
        message
    })
}

#[tauri::command]
fn secure_store_delete(key: String) -> Result<(), String> {
    let entry = secure_entry(&key)?;
    match entry.delete_credential() {
        Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
        Err(error) => {
            let message = error.to_string();
            log::warn!("secure credential delete failed: {message}");
            Err(message)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(desktop_log_level())
                .max_file_size(LOG_MAX_FILE_SIZE_BYTES)
                .rotation_strategy(RotationStrategy::KeepSome(LOG_ARCHIVE_COUNT))
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some(LOG_FILE_NAME.into()),
                    }),
                ])
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            secure_store_get,
            secure_store_set,
            secure_store_delete
        ])
        .setup(|_app| {
            log::info!("SpeakRight desktop runtime initialized");
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
