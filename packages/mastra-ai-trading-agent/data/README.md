# Data Directory Structure

This directory contains sample files and serves as the recommended location for storing Pinescript strategies and backtesting results for the Strategy Improvement Workflow.

## Directory Structure

```
data/
├── strategies/          # Pinescript strategy files (.pine)
│   └── sample-strategy.pine
├── backtests/          # Backtesting results organized by strategy
│   └── sample-strategy/    # Directory named after strategy (without .pine)
│       ├── sample-backtest-results.csv
│       ├── performance-summary.txt
│       └── monthly-analysis.md
└── README.md           # This file
```

## File Locations and Paths

When using the Strategy Improvement Workflow, the `readFileSync` function reads files relative to the **current working directory** where the Mastra application is running.

### Current Working Directory
```
/Users/naikkuma/Repositories/tmp/baalam-fintech/packages/mastra-ai-trading-agent
```

### Recommended File Paths

When calling the workflow, use these relative paths:

**For Pinescript strategies:**
```
data/strategies/your-strategy.pine
```

**For backtesting results:**
```
data/backtests/your-backtest-results.csv
```

### Workflow Input Options

**Option 1: Use defaults (recommended for testing)**
The workflow will automatically use the sample strategy and all its backtest files:

```javascript
{}
```

**Option 2: Specify a different strategy**
```javascript
{
  "strategyName": "your-strategy"
}
```

**Option 3: Use custom directories**
```javascript
{
  "strategiesDir": "../../data/strategies",
  "backtestsDir": "../../data/backtests",
  "strategyName": "your-strategy"
}
```

> **Note**: The workflow runs from `.mastra/output` directory, so custom paths need `../../` prefix to navigate back to the package root.

## File Format Requirements

### Pinescript Files (.pine)
- Must be valid Pinescript v5 syntax
- Should contain a complete trading strategy
- Include proper strategy() declaration
- File extension: `.pine` (recommended) or `.txt`

### Backtesting CSV Files
- Must have headers in the first row
- Should include key columns like: Date, Time, Symbol, Type, Side, Qty, Price, Profit, etc.
- Use comma-separated values
- File extension: `.csv`

## Sample Files

### Sample Strategy (`sample-strategy.pine`)
A basic RSI-based trading strategy demonstrating:
- Input parameters
- Technical indicator calculations
- Entry/exit conditions
- Position sizing
- Visual plotting

### Sample Backtest Results (`sample-backtest-results.csv`)
Contains sample backtesting data with:
- Trade entries and exits
- Profit/loss calculations
- Equity curve progression
- Win/loss tracking
- Drawdown measurements

## How the Workflow Processes Multiple Files

When you run the workflow:

1. **Strategy File**: Reads the `.pine` file from the strategies directory
2. **Backtest Directory**: Finds the corresponding directory in `backtests/` with the same name as the strategy
3. **All Files**: Reads **ALL** files from the backtest directory and feeds them to the Chief Strategy Agent (CSA)
4. **File Types**: Supports CSV, Markdown (.md), Text (.txt), and other file formats
5. **CSA Analysis**: Each file is presented as a separate section to the CSA for comprehensive analysis

## Adding Your Own Files

1. **For Pinescript strategies:**
   ```bash
   # Copy your strategy file to the strategies directory
   cp /path/to/your-strategy.pine data/strategies/
   ```

2. **For backtesting results:**
   ```bash
   # Create a directory named after your strategy (without .pine extension)
   mkdir data/backtests/your-strategy

   # Add multiple analysis files
   cp /path/to/your-backtest.csv data/backtests/your-strategy/
   cp /path/to/your-analysis.md data/backtests/your-strategy/
   cp /path/to/your-summary.txt data/backtests/your-strategy/
   ```

3. **Run the workflow:**
   ```javascript
   {
     "strategyName": "your-strategy"
   }
   ```

## Absolute Path Alternative

If you prefer to use absolute paths, you can also specify full file paths:

```javascript
{
  "pinescriptPath": "/Users/naikkuma/Repositories/tmp/baalam-fintech/packages/mastra-ai-trading-agent/data/strategies/your-strategy.pine",
  "backtestingResultsPath": "/Users/naikkuma/Repositories/tmp/baalam-fintech/packages/mastra-ai-trading-agent/data/backtests/your-results.csv"
}
```

## Security Note

- Only place trusted Pinescript files in this directory
- Ensure CSV files don't contain sensitive trading data if sharing
- Consider using `.gitignore` to exclude sensitive strategy files from version control