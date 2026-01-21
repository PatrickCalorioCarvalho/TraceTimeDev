
use crate::AppState;
use reqwest;

#[tauri::command]
pub fn test_gitlab(url: String, token: String) -> Result<(String, i64), String> {
    let client = reqwest::blocking::Client::new();
    let resp = client
        .get(format!("{}/api/v4/user", url))
        .bearer_auth(token)
        .send()
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("Erro: {}", resp.status()));
    }

    let json: serde_json::Value = resp.json().map_err(|e| e.to_string())?;
    let username = json["username"].as_str().unwrap_or("").to_string();
    let id = json["id"].as_i64().unwrap_or(0);

    Ok((username, id))
}

#[tauri::command]
pub async fn gitlab_groups(state: tauri::State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let (url, token) = {
        let conn = state.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT url, token FROM config LIMIT 1").unwrap();
        let mut rows = stmt.query([]).unwrap();

        if let Some(row) = rows.next().unwrap() {
            let url: String = row.get::<_, String>(0).unwrap();
            let token: String = row.get::<_, String>(1).unwrap();
            (url, token)
        } else {
            return Err("Configuração não encontrada".into());
        }
    };
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/api/v4/groups", url))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: Vec<serde_json::Value> = resp.json().await.map_err(|e| e.to_string())?;
    Ok(json)
}


#[tauri::command]
pub async fn gitlab_projects(state: tauri::State<'_, AppState>, group_id: i64) -> Result<Vec<serde_json::Value>, String> {
    let (url, token) = {
        let conn = state.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT url, token FROM config LIMIT 1").unwrap();
        let mut rows = stmt.query([]).unwrap();

        if let Some(row) = rows.next().unwrap() {
            let url: String = row.get::<_, String>(0).unwrap();
            let token: String = row.get::<_, String>(1).unwrap();
            (url, token)
        } else {
            return Err("Configuração não encontrada".into());
        }
    };
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/api/v4/groups/{}/projects", url, group_id))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: Vec<serde_json::Value> = resp.json().await.map_err(|e| e.to_string())?;
    Ok(json)
}

#[tauri::command]
pub async fn gitlab_issues(state: tauri::State<'_, AppState>, project_id: i64) -> Result<Vec<serde_json::Value>, String> {
    let (url, token) = {
        let conn = state.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT url, token FROM config LIMIT 1").unwrap();
        let mut rows = stmt.query([]).unwrap();

        if let Some(row) = rows.next().unwrap() {
            let url: String = row.get::<_, String>(0).unwrap();
            let token: String = row.get::<_, String>(1).unwrap();
            (url, token)
        } else {
            return Err("Configuração não encontrada".into());
        }
    };
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/api/v4/projects/{}/issues", url, project_id))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: Vec<serde_json::Value> = resp.json().await.map_err(|e| e.to_string())?;
    Ok(json)
}

#[tauri::command]
pub async fn gitlab_add_time(state: tauri::State<'_, AppState>,  
    project_id: i64,
    issue_iid: i64,
    duration: String,
    summary: String) -> Result<(), String> {

    let (url, token) = {
        let conn = state.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT url, token FROM config LIMIT 1").unwrap();
        let mut rows = stmt.query([]).unwrap();

        if let Some(row) = rows.next().unwrap() {
            let url: String = row.get::<_, String>(0).unwrap();
            let token: String = row.get::<_, String>(1).unwrap();
            (url, token)
        } else {
            return Err("Configuração não encontrada".into());
        }
    };
    
    let client = reqwest::Client::new();
    let resp = client
        .post(format!(
            "{}/api/v4/projects/{}/issues/{}/add_spent_time",
            url, project_id, issue_iid
        ))
        .bearer_auth(token)
        .json(&serde_json::json!({
            "duration": duration,
            "summary": summary
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
        let status = resp.status();

        if !status.is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("GitLab error {}: {}", status, text));
        }

    Ok(())
}
