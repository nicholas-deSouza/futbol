#!/bin/bash

# Download Transfermarkt dataset from Kaggle
#
# Option 1: Using Kaggle CLI (if installed)
# kaggle datasets download davidcariboo/player-scores -p data/raw --unzip
#
# Option 2: Manual download
# 1. Go to https://www.kaggle.com/datasets/davidcariboo/player-scores
# 2. Click "Download" (requires Kaggle account)
# 3. Extract the zip file to data/raw/
#
# Required files after extraction:
# - data/raw/appearances.csv
# - data/raw/players.csv
# - data/raw/clubs.csv
# - data/raw/games.csv

echo "=== Transfermarkt Dataset Download ==="
echo ""

if command -v kaggle &> /dev/null; then
    echo "Kaggle CLI found. Downloading dataset..."
    kaggle datasets download davidcariboo/player-scores -p data/raw --unzip
    echo "Download complete!"
else
    echo "Kaggle CLI not installed."
    echo ""
    echo "Please download the dataset manually:"
    echo "1. Go to: https://www.kaggle.com/datasets/davidcariboo/player-scores"
    echo "2. Click 'Download' (requires free Kaggle account)"
    echo "3. Extract the zip file contents to: data/raw/"
    echo ""
    echo "After extraction, you should have:"
    echo "  - data/raw/appearances.csv"
    echo "  - data/raw/players.csv"
    echo "  - data/raw/clubs.csv"
    echo "  - data/raw/games.csv"
    echo ""
    echo "Then run: npm run preprocess"
fi
