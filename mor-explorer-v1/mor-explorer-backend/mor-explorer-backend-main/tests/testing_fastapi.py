from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import sys
import os
from pathlib import Path
import ipdb
import pytest
#ipdb.set_trace();

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}


@patch('main.analyze_mor_stakers')
@patch('main.calculate_average_multipliers')
@patch('main.calculate_pool_rewards_summary')
@patch('main.read_emission_schedule')


def test_analyze_mor_stakers(mock_read_emission, mock_calc_pool, mock_calc_avg, mock_analyze):
    # Mock return values
    mock_analyze.return_value = {
        'average_stake_time': {'pool1': timedelta(days=30), 'pool2': timedelta(days=45)},
        'combined_average_stake_time': timedelta(days=37)
    }
    mock_calc_avg.return_value = {
        'overall_average': 1.5,
        'capital_average': 1.2,
        'code_average': 1.8
    }
    mock_calc_pool.return_value = {'pool1': 1000, 'pool2': 2000}
    mock_read_emission.return_value = {'daily': 100, 'weekly': 700}

    response = client.get("/analyze-mor-stakers")
    assert response.status_code == 200
    
    data = response.json()
    assert 'staker_analysis' in data
    assert 'multiplier_analysis' in data
    assert 'stakereward_analysis' in data
    assert 'emissionreward_analysis' in data

    # Check if timedelta objects are converted to strings
    assert isinstance(data['staker_analysis']['average_stake_time']['pool1'], str)
    assert isinstance(data['staker_analysis']['combined_average_stake_time'], str)

    # Check if float values are correctly represented
    assert isinstance(data['multiplier_analysis']['overall_average'], float)

@patch('main.protocol_liquidity')
def test_protocol_owned_liquidity(mock_protocol_liquidity):
    mock_protocol_liquidity.return_value = {"liquidity": 1000000}

    response = client.get("/protocol_owned_liqudity")
    assert response.status_code == 200
    assert response.json() == {"liquidity": 1000000}

@patch('main.give_more_reward_response')
def test_give_more_reward(mock_give_more_reward):
    mock_give_more_reward.return_value = {"additional_reward": 500}

    response = client.get("/give_more_reward")
    assert response.status_code == 200
    assert response.json() == {"additional_reward": 500}

def test_analyze_mor_stakers_error():
    with patch('main.analyze_mor_stakers', side_effect=Exception("Test error")):
        response = client.get("/analyze-mor-stakers")
        assert response.status_code == 500
        assert "An error occurred" in response.json()["detail"]

def test_protocol_owned_liquidity_error():
    with patch('main.protocol_liquidity', side_effect=Exception("Test error")):
        response = client.get("/protocol_owned_liqudity")
        assert response.status_code == 500
        assert "An error occurred" in response.json()["detail"]

def test_give_more_reward_error():
    with patch('main.give_more_reward_response', side_effect=Exception("Test error")):
        response = client.get("/give_mor_reward")
        assert response.status_code == 500
        assert "An error occurred" in response.json()["detail"]