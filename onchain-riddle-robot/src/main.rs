use ethers::prelude::*;
use ethers::providers::StreamExt;
use ethers::utils::keccak256;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::Arc;

abigen!(
    OnchainRiddle,
    r#"[
        event Winner(address indexed user)
        function setRiddle(string _riddle, bytes32 _answerHash) external
        function riddle() external view returns (string)
        function isActive() external view returns (bool)
    ]"#
);

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    max_tokens: Option<u16>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessage,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

/// Generates a new riddle using the OpenAI API.
/// Expects two lines: first line is the riddle text and second line is its one-word answer.
async fn generate_riddle(api_key: &str) -> Result<(String, String), Box<dyn std::error::Error>> {
    let client = Client::new();

    let messages = vec![
        OpenAIMessage {
            role: "system".to_string(),
            content: "You are a helpful assistant that generates simple riddles. Each riddle should have a one-word answer in lowercase.".to_string(),
        },
        OpenAIMessage {
            role: "user".to_string(),
            content: "Generate a new riddle in the following format:\n<riddle text>\n<one-word answer in lowercase>\nSeparate the riddle and answer with a newline.".to_string(),
        },
    ];

    let request_body = OpenAIRequest {
        model: "gpt-4o".to_string(),
        messages,
        max_tokens: Some(1000),
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&request_body)
        .send()
        .await?
        .json::<OpenAIResponse>()
        .await?;

    if let Some(choice) = response.choices.first() {
        let content = &choice.message.content;
        let mut lines = content.lines();
        if let (Some(riddle), Some(answer)) = (lines.next(), lines.next()) {
            return Ok((riddle.trim().to_string(), answer.trim().to_string()));
        }
    }
    Err("Failed to generate riddle".into())
}

/// Updates the contract with a new riddle by generating a riddle and sending a transaction.
async fn update_riddle(
    contract: &OnchainRiddle<SignerMiddleware<Provider<Http>, LocalWallet>>,
    openai_api_key: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let (riddle, answer) = generate_riddle(openai_api_key).await?;
    println!(
        "Generated new riddle:\nRiddle: {}\nAnswer: {}",
        riddle, answer
    );

    let answer_hash = keccak256(answer.as_bytes());
    println!("Sending transaction to set the new riddle...");
    let send_riddle = contract.set_riddle(riddle.clone(), answer_hash);
    let tx = send_riddle.send().await?;
    println!("Transaction submitted: {:?}", tx);

    if let Some(receipt) = tx.await? {
        println!("Transaction confirmed: {:?}", receipt.transaction_hash);
    } else {
        eprintln!("Transaction failed.");
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables from .env.
    dotenv::dotenv().ok();

    // Read environment variables.
    let rpc_url = env::var("RPC_URL")?;
    let private_key = env::var("PRIVATE_KEY")?;
    let openai_api_key = env::var("OPENAI_API_KEY")?;
    let contract_address: Address = env::var("CONTRACT_ADDRESS")?.parse()?;
    let chain_id: u64 = env::var("CHAIN_ID")
        .unwrap_or_else(|_| "8453".to_string())
        .parse()?;

    // Set up provider and wallet.
    let provider = Provider::<Http>::try_from(rpc_url.clone())?
        .interval(std::time::Duration::from_millis(1000));
    println!("Provider created. RPC URL: {}", rpc_url);
    let wallet: LocalWallet = private_key.parse::<LocalWallet>()?.with_chain_id(chain_id);
    let client = SignerMiddleware::new(provider, wallet);
    let client = Arc::new(client);

    // Instantiate the contract.
    let contract = Arc::new(OnchainRiddle::new(contract_address, client.clone()));

    // Always update the riddle on startup.
    println!("Setting up initial riddle on startup...");
    if let Err(e) = update_riddle(&contract, &openai_api_key).await {
        eprintln!("Error setting initial riddle: {}", e);
    }

    // Set up event filter for Winner events starting from the latest block.
    let filter = contract
        .event::<WinnerFilter>()
        .from_block(BlockNumber::Latest);
    let mut stream = filter.stream().await?.boxed();

    println!("Robot service running. Listening for correct answers...");
    while let Some(Ok(event)) = stream.next().await {
        println!("Winner event detected: {:?}", event);
        if let Err(e) = update_riddle(&contract, &openai_api_key).await {
            eprintln!("Error updating riddle after event: {}", e);
        }
    }

    Ok(())
}
