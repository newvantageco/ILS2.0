"""
Fine-Tuning Script for Ophthalmic Specialist LLaMA Model

This script fine-tunes a base LLaMA model using LoRA (Low-Rank Adaptation)
on optical dispensing and ophthalmic knowledge.

Usage:
    python train_ophthalmic_model.py --data_path ./data/ophthalmic_qa.jsonl
"""

import torch
import argparse
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from trl import SFTTrainer
import os


def format_prompt(example):
    """
    Format the dataset into a conversational prompt structure.
    
    Expected input format:
    {
        "prompt": "Question about optics...",
        "completion": "Detailed answer..."
    }
    """
    prompt_template = """<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are an expert in optical dispensing and ophthalmic care. You provide accurate, professional advice about eyewear, lenses, vision correction, and eye health. Always prioritize patient safety and recommend professional consultation when appropriate.<|eot_id|><|start_header_id|>user<|end_header_id|>

{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{completion}<|eot_id|>"""
    
    return {
        "text": prompt_template.format(
            prompt=example["prompt"],
            completion=example["completion"]
        )
    }


def train_model(
    data_path: str,
    model_name: str = "meta-llama/Llama-3.1-8B-Instruct",
    output_dir: str = "./ophthalmic-specialist-model",
    num_train_epochs: int = 3,
    per_device_train_batch_size: int = 1,
    gradient_accumulation_steps: int = 4,
    learning_rate: float = 2e-4,
    max_seq_length: int = 1024,
    use_4bit: bool = True,
):
    """
    Fine-tune a LLaMA model on ophthalmic knowledge.
    
    Args:
        data_path: Path to JSONL training data
        model_name: Base model identifier from Hugging Face
        output_dir: Directory to save fine-tuned model
        num_train_epochs: Number of training epochs
        per_device_train_batch_size: Batch size per device
        gradient_accumulation_steps: Steps to accumulate gradients
        learning_rate: Learning rate for optimization
        max_seq_length: Maximum sequence length
        use_4bit: Use 4-bit quantization (QLoRA)
    """
    
    print(f"🚀 Starting fine-tuning process...")
    print(f"📊 Loading dataset from: {data_path}")
    
    # 1. Load Dataset
    dataset = load_dataset("json", data_files=data_path, split="train")
    
    # Format the dataset
    dataset = dataset.map(format_prompt, remove_columns=dataset.column_names)
    
    print(f"✅ Dataset loaded: {len(dataset)} examples")
    print(f"📝 Sample formatted text:")
    print(dataset[0]["text"][:500] + "...")
    
    # 2. Configure Quantization (for efficiency)
    if use_4bit:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_use_double_quant=True,
        )
        print("✅ 4-bit quantization enabled (QLoRA)")
    else:
        bnb_config = None
    
    # 3. Load Model & Tokenizer
    print(f"📥 Loading model: {model_name}")
    
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.bfloat16 if use_4bit else torch.float16,
    )
    
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"  # Fix for fp16
    
    # Prepare model for k-bit training
    if use_4bit:
        model = prepare_model_for_kbit_training(model)
    
    # 4. Configure LoRA
    peft_config = LoraConfig(
        r=16,  # Rank
        lora_alpha=32,  # Scaling factor
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    
    print("✅ LoRA configuration created")
    
    # 5. Configure Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=num_train_epochs,
        per_device_train_batch_size=per_device_train_batch_size,
        gradient_accumulation_steps=gradient_accumulation_steps,
        gradient_checkpointing=True,
        optim="paged_adamw_32bit",
        logging_steps=10,
        save_strategy="steps",
        save_steps=50,
        learning_rate=learning_rate,
        weight_decay=0.001,
        fp16=False,
        bf16=True,
        max_grad_norm=0.3,
        max_steps=-1,
        warmup_ratio=0.03,
        group_by_length=True,
        lr_scheduler_type="cosine",
        report_to="none",  # Can be "tensorboard" or "wandb"
    )
    
    # 6. Initialize Trainer
    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        peft_config=peft_config,
        dataset_text_field="text",
        max_seq_length=max_seq_length,
        tokenizer=tokenizer,
        args=training_args,
        packing=False,
    )
    
    print(f"\n{'='*50}")
    print("🎯 Starting Training...")
    print(f"{'='*50}\n")
    
    # 7. Train!
    trainer.train()
    
    # 8. Save Model
    print(f"\n💾 Saving model to: {output_dir}")
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    
    print(f"\n{'='*50}")
    print("✅ Training Complete!")
    print(f"{'='*50}")
    print(f"\nModel saved to: {output_dir}")
    print("\nTo use this model:")
    print(f"  1. Load with: AutoModelForCausalLM.from_pretrained('{output_dir}')")
    print(f"  2. Or merge with base model for deployment")
    

def main():
    parser = argparse.ArgumentParser(description="Fine-tune LLaMA for ophthalmic expertise")
    parser.add_argument(
        "--data_path",
        type=str,
        required=True,
        help="Path to JSONL training data",
    )
    parser.add_argument(
        "--model_name",
        type=str,
        default="meta-llama/Llama-3.1-8B-Instruct",
        help="Base model name from Hugging Face",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./ophthalmic-specialist-model",
        help="Output directory for fine-tuned model",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=3,
        help="Number of training epochs",
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=1,
        help="Training batch size per device",
    )
    parser.add_argument(
        "--learning_rate",
        type=float,
        default=2e-4,
        help="Learning rate",
    )
    parser.add_argument(
        "--max_seq_length",
        type=int,
        default=1024,
        help="Maximum sequence length",
    )
    
    args = parser.parse_args()
    
    # Check if data file exists
    if not os.path.exists(args.data_path):
        raise FileNotFoundError(f"Training data not found: {args.data_path}")
    
    # Start training
    train_model(
        data_path=args.data_path,
        model_name=args.model_name,
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        max_seq_length=args.max_seq_length,
    )


if __name__ == "__main__":
    main()
