"""
Realistic seed data for 20+ Indian cities with disease surveillance metrics.
All data is served from memory — no database required for development.
"""

cities = [
  {
    "name": "Delhi",
    "state": "Delhi",
    "lat": 28.6139,
    "lng": 77.209,
    "risk_score": 87,
    "risk_level": "high",
    "mentions": 1247,
    "diseases": [
      {
        "name": "Dengue",
        "cases": 342,
        "trend": "up"
      },
      {
        "name": "Flu",
        "cases": 189,
        "trend": "stable"
      },
      {
        "name": "COVID-like",
        "cases": 56,
        "trend": "down"
      }
    ],
    "symptoms": [
      "Fever",
      "Headache",
      "Joint Pain",
      "Fatigue",
      "Rash"
    ],
    "news": [
      {
        "title": "Dengue cases surge in East Delhi colonies",
        "source": "Times of India",
        "time": "2h ago"
      },
      {
        "title": "AIIMS reports 30% rise in fever patients",
        "source": "NDTV",
        "time": "5h ago"
      }
    ],
    "prediction_7d": [
      342,
      359,
      386,
      415,
      432,
      404,
      366
    ],
    "population": "32M"
  },
  {
    "name": "Mumbai",
    "state": "Maharashtra",
    "lat": 19.076,
    "lng": 72.8777,
    "risk_score": 72,
    "risk_level": "high",
    "mentions": 892,
    "diseases": [
      {
        "name": "Dengue",
        "cases": 198,
        "trend": "up"
      },
      {
        "name": "Malaria",
        "cases": 145,
        "trend": "up"
      },
      {
        "name": "TB",
        "cases": 89,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Fever",
      "Chills",
      "Sweating",
      "Body Ache"
    ],
    "news": [
      {
        "title": "Malaria cases spike after heavy monsoon rains",
        "source": "Indian Express",
        "time": "3h ago"
      }
    ],
    "prediction_7d": [
      198,
      209,
      229,
      251,
      266,
      239,
      207
    ],
    "population": "21M"
  },
  {
    "name": "Lucknow",
    "state": "Uttar Pradesh",
    "lat": 26.8467,
    "lng": 80.9462,
    "risk_score": 63,
    "risk_level": "moderate",
    "mentions": 478,
    "diseases": [
      {
        "name": "Flu",
        "cases": 156,
        "trend": "up"
      },
      {
        "name": "Dengue",
        "cases": 112,
        "trend": "up"
      },
      {
        "name": "TB",
        "cases": 45,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Fever",
      "Joint Pain",
      "Cough"
    ],
    "news": [],
    "prediction_7d": [
      112,
      119,
      126,
      132,
      137,
      142,
      146
    ],
    "population": "3.5M"
  },
  {
    "name": "Jaipur",
    "state": "Rajasthan",
    "lat": 26.9124,
    "lng": 75.7873,
    "risk_score": 62,
    "risk_level": "moderate",
    "mentions": 478,
    "diseases": [
      {
        "name": "Malaria",
        "cases": 134,
        "trend": "up"
      },
      {
        "name": "Dengue",
        "cases": 67,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Fever",
      "Chills",
      "Headache",
      "Rash"
    ],
    "news": [],
    "prediction_7d": [
      134,
      141,
      148,
      154,
      159,
      164,
      168
    ],
    "population": "4M"
  },
  {
    "name": "Kolkata",
    "state": "West Bengal",
    "lat": 22.5726,
    "lng": 88.3639,
    "risk_score": 58,
    "risk_level": "moderate",
    "mentions": 654,
    "diseases": [
      {
        "name": "Dengue",
        "cases": 156,
        "trend": "up"
      },
      {
        "name": "Flu",
        "cases": 98,
        "trend": "down"
      }
    ],
    "symptoms": [
      "Fever",
      "Headache",
      "Nausea",
      "Fatigue"
    ],
    "news": [],
    "prediction_7d": [
      156,
      170,
      182,
      190,
      195,
      200,
      208
    ],
    "population": "15M"
  },
  {
    "name": "Guwahati",
    "state": "Assam",
    "lat": 26.1445,
    "lng": 91.7362,
    "risk_score": 52,
    "risk_level": "moderate",
    "mentions": 298,
    "diseases": [
      {
        "name": "Malaria",
        "cases": 98,
        "trend": "up"
      },
      {
        "name": "Dengue",
        "cases": 56,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Fever",
      "Chills",
      "Sweating"
    ],
    "news": [],
    "prediction_7d": [
      98,
      105,
      112,
      118,
      122,
      128,
      135
    ],
    "population": "1.1M"
  },
  {
    "name": "Hyderabad",
    "state": "Telangana",
    "lat": 17.385,
    "lng": 78.4867,
    "risk_score": 48,
    "risk_level": "moderate",
    "mentions": 445,
    "diseases": [
      {
        "name": "Dengue",
        "cases": 78,
        "trend": "stable"
      },
      {
        "name": "Flu",
        "cases": 45,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Fever",
      "Headache",
      "Fatigue"
    ],
    "news": [],
    "prediction_7d": [
      89,
      95,
      102,
      108,
      112,
      118,
      125
    ],
    "population": "10M"
  },
  {
    "name": "Ranchi",
    "state": "Jharkhand",
    "lat": 23.3441,
    "lng": 85.3096,
    "risk_score": 47,
    "risk_level": "moderate",
    "mentions": 312,
    "diseases": [
      {
        "name": "Malaria",
        "cases": 71,
        "trend": "up"
      },
      {
        "name": "Dengue",
        "cases": 34,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Fever",
      "Chills",
      "Headache"
    ],
    "news": [],
    "prediction_7d": [
      71,
      78,
      85,
      90,
      95,
      100,
      106
    ],
    "population": "1.5M"
  },
  {
    "name": "Bangalore",
    "state": "Karnataka",
    "lat": 12.9716,
    "lng": 77.5946,
    "risk_score": 45,
    "risk_level": "moderate",
    "mentions": 312,
    "diseases": [
      {
        "name": "Flu",
        "cases": 134,
        "trend": "stable"
      },
      {
        "name": "COVID-like",
        "cases": 23,
        "trend": "down"
      }
    ],
    "symptoms": [
      "Cough",
      "Cold",
      "Mild Fever"
    ],
    "news": [],
    "prediction_7d": [
      67,
      62,
      58,
      55,
      52,
      50,
      48
    ],
    "population": "13M"
  },
  {
    "name": "Chennai",
    "state": "Tamil Nadu",
    "lat": 13.0827,
    "lng": 80.2707,
    "risk_score": 45,
    "risk_level": "moderate",
    "mentions": 523,
    "diseases": [
      {
        "name": "Dengue",
        "cases": 112,
        "trend": "stable"
      },
      {
        "name": "COVID-like",
        "cases": 34,
        "trend": "down"
      }
    ],
    "symptoms": [
      "Fever",
      "Cough",
      "Body Pain"
    ],
    "news": [],
    "prediction_7d": [
      120,
      118,
      122,
      125,
      123,
      120,
      118
    ],
    "population": "11M"
  },
  {
    "name": "Patna",
    "state": "Bihar",
    "lat": 25.6093,
    "lng": 85.1376,
    "risk_score": 45,
    "risk_level": "moderate",
    "mentions": 334,
    "diseases": [
      {
        "name": "Dengue",
        "cases": 67,
        "trend": "up"
      },
      {
        "name": "Flu",
        "cases": 45,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Fever",
      "Headache",
      "Fatigue"
    ],
    "news": [],
    "prediction_7d": [
      89,
      92,
      95,
      98,
      100,
      103,
      105
    ],
    "population": "2.5M"
  },
  {
    "name": "Visakhapatnam",
    "state": "Andhra Pradesh",
    "lat": 17.6868,
    "lng": 83.2185,
    "risk_score": 44,
    "risk_level": "moderate",
    "mentions": 267,
    "diseases": [
      {
        "name": "Dengue",
        "cases": 63,
        "trend": "up"
      },
      {
        "name": "Flu",
        "cases": 34,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Fever",
      "Headache",
      "Joint Pain"
    ],
    "news": [],
    "prediction_7d": [
      63,
      68,
      72,
      76,
      80,
      84,
      88
    ],
    "population": "2.1M"
  },
  {
    "name": "Pune",
    "state": "Maharashtra",
    "lat": 18.5204,
    "lng": 73.8567,
    "risk_score": 44,
    "risk_level": "moderate",
    "mentions": 389,
    "diseases": [
      {
        "name": "Flu",
        "cases": 78,
        "trend": "stable"
      },
      {
        "name": "Dengue",
        "cases": 45,
        "trend": "down"
      }
    ],
    "symptoms": [
      "Fever",
      "Cough",
      "Runny Nose"
    ],
    "news": [],
    "prediction_7d": [
      78,
      75,
      72,
      70,
      68,
      65,
      63
    ],
    "population": "7M"
  },
  {
    "name": "Nagpur",
    "state": "Maharashtra",
    "lat": 21.1458,
    "lng": 79.0882,
    "risk_score": 41,
    "risk_level": "low",
    "mentions": 234,
    "diseases": [
      {
        "name": "Dengue",
        "cases": 41,
        "trend": "stable"
      },
      {
        "name": "Flu",
        "cases": 28,
        "trend": "down"
      }
    ],
    "symptoms": [
      "Fever",
      "Body Ache"
    ],
    "news": [],
    "prediction_7d": [
      41,
      39,
      37,
      36,
      35,
      34,
      33
    ],
    "population": "2.9M"
  },
  {
    "name": "Ahmedabad",
    "state": "Gujarat",
    "lat": 23.0225,
    "lng": 72.5714,
    "risk_score": 40,
    "risk_level": "low",
    "mentions": 267,
    "diseases": [
      {
        "name": "Flu",
        "cases": 56,
        "trend": "down"
      },
      {
        "name": "TB",
        "cases": 34,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Cough",
      "Fever",
      "Weight Loss"
    ],
    "news": [],
    "prediction_7d": [
      56,
      52,
      49,
      46,
      44,
      42,
      40
    ],
    "population": "8M"
  },
  {
    "name": "Surat",
    "state": "Gujarat",
    "lat": 21.1702,
    "lng": 72.8311,
    "risk_score": 36,
    "risk_level": "low",
    "mentions": 198,
    "diseases": [
      {
        "name": "Dengue",
        "cases": 36,
        "trend": "down"
      },
      {
        "name": "Flu",
        "cases": 22,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Fever",
      "Headache"
    ],
    "news": [],
    "prediction_7d": [
      36,
      34,
      32,
      31,
      30,
      29,
      28
    ],
    "population": "7.8M"
  },
  {
    "name": "Bhopal",
    "state": "Madhya Pradesh",
    "lat": 23.2599,
    "lng": 77.4126,
    "risk_score": 35,
    "risk_level": "low",
    "mentions": 178,
    "diseases": [
      {
        "name": "Malaria",
        "cases": 35,
        "trend": "stable"
      },
      {
        "name": "Flu",
        "cases": 20,
        "trend": "down"
      }
    ],
    "symptoms": [
      "Fever",
      "Chills"
    ],
    "news": [],
    "prediction_7d": [
      35,
      33,
      32,
      31,
      30,
      29,
      28
    ],
    "population": "2.4M"
  },
  {
    "name": "Kochi",
    "state": "Kerala",
    "lat": 9.9312,
    "lng": 76.2673,
    "risk_score": 34,
    "risk_level": "low",
    "mentions": 156,
    "diseases": [
      {
        "name": "Dengue",
        "cases": 34,
        "trend": "stable"
      },
      {
        "name": "Flu",
        "cases": 18,
        "trend": "down"
      }
    ],
    "symptoms": [
      "Fever",
      "Body Pain"
    ],
    "news": [],
    "prediction_7d": [
      34,
      32,
      31,
      30,
      29,
      28,
      27
    ],
    "population": "2.1M"
  },
  {
    "name": "Indore",
    "state": "Madhya Pradesh",
    "lat": 22.7196,
    "lng": 75.8577,
    "risk_score": 33,
    "risk_level": "low",
    "mentions": 145,
    "diseases": [
      {
        "name": "Flu",
        "cases": 33,
        "trend": "down"
      },
      {
        "name": "Dengue",
        "cases": 15,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Cough",
      "Fever"
    ],
    "news": [],
    "prediction_7d": [
      33,
      31,
      30,
      29,
      28,
      27,
      26
    ],
    "population": "3.6M"
  },
  {
    "name": "Chandigarh",
    "state": "Chandigarh",
    "lat": 30.7333,
    "lng": 76.7794,
    "risk_score": 32,
    "risk_level": "low",
    "mentions": 134,
    "diseases": [
      {
        "name": "Flu",
        "cases": 32,
        "trend": "down"
      },
      {
        "name": "Dengue",
        "cases": 12,
        "trend": "stable"
      }
    ],
    "symptoms": [
      "Cough",
      "Cold"
    ],
    "news": [],
    "prediction_7d": [
      32,
      30,
      29,
      28,
      27,
      26,
      25
    ],
    "population": "1.2M"
  }
]

all_diseases = ["Dengue", "Flu", "TB", "COVID-like", "Malaria"]

trend_data = [
    {"month": "Aug", "dengue": 120, "flu": 89, "tb": 45, "covid": 34, "malaria": 56},
    {"month": "Sep", "dengue": 180, "flu": 95, "tb": 42, "covid": 28, "malaria": 62},
    {"month": "Oct", "dengue": 250, "flu": 120, "tb": 48, "covid": 22, "malaria": 78},
    {"month": "Nov", "dengue": 320, "flu": 145, "tb": 50, "covid": 18, "malaria": 85},
    {"month": "Dec", "dengue": 280, "flu": 198, "tb": 52, "covid": 25, "malaria": 72},
    {"month": "Jan", "dengue": 220, "flu": 230, "tb": 55, "covid": 30, "malaria": 60},
    {"month": "Feb", "dengue": 180, "flu": 210, "tb": 48, "covid": 35, "malaria": 52},
    {"month": "Mar", "dengue": 342, "flu": 189, "tb": 56, "covid": 42, "malaria": 68},
]

alerts = [
    {"id": "ALT001", "severity": "high", "title": "Dengue Cluster Detected", "location": "Rohini, Delhi", "region": "North Delhi", "confidence": 82, "time": "47 min ago", "description": "20+ social media mentions of dengue symptoms in concentrated area.", "dismissed": False, "signal_source": {"news": 38, "social": 62}, "recommendations": ["Deploy rapid screening teams", "Increase vector control spraying", "Issue public health advisory"]},
    {"id": "ALT002", "severity": "high", "title": "Flu Spike Alert", "location": "Anand Vihar, Delhi", "region": "East Delhi", "confidence": 76, "time": "34 min ago", "description": "Post-monsoon flu cases exceeding 3-year average by 45%.", "dismissed": False, "signal_source": {"news": 45, "social": 55}, "recommendations": ["Distribute flu vaccination kits", "Set up temporary health camps"]},
    {"id": "ALT003", "severity": "high", "title": "TB Dropout Risk", "location": "Dharavi, Mumbai", "region": "Mumbai Central", "confidence": 71, "time": "19 min ago", "description": "AI model predicts 23 patients at high dropout risk.", "dismissed": False, "signal_source": {"news": 30, "social": 70}, "recommendations": ["Assign community health workers", "Initiate phone-based reminders"]},
    {"id": "ALT004", "severity": "moderate", "title": "Dengue Cluster Detected", "location": "Howrah, Kolkata", "region": "South Kolkata", "confidence": 68, "time": "1 hr ago", "description": "Unusual spike in dengue mentions near Howrah bridge area.", "dismissed": False, "signal_source": {"news": 42, "social": 58}, "recommendations": ["Conduct door-to-door surveillance", "Deploy fogging teams"]},
    {"id": "ALT005", "severity": "moderate", "title": "Flu Spike Alert", "location": "Lucknow Central", "region": "Uttar Pradesh", "confidence": 64, "time": "2 hr ago", "description": "Flu mentions up 200% in local news.", "dismissed": False, "signal_source": {"news": 55, "social": 45}, "recommendations": ["Alert district health officials", "Prepare OPD surge capacity"]},
    {"id": "ALT006", "severity": "moderate", "title": "Malaria Spike Alert", "location": "Jaipur Old City", "region": "Rajasthan", "confidence": 58, "time": "5 hr ago", "description": "Post-monsoon malaria cases rising.", "dismissed": False, "signal_source": {"news": 50, "social": 50}, "recommendations": ["Distribute mosquito nets", "Initiate anti-larval spraying"]},
    {"id": "ALT007", "severity": "low", "title": "Dengue Watch", "location": "Chennai Marina", "region": "South Chennai", "confidence": 55, "time": "6 hr ago", "description": "Below outbreak threshold but monitoring recommended.", "dismissed": False, "signal_source": {"news": 60, "social": 40}, "recommendations": ["Increase surveillance frequency"]},
]

ai_insights = [
    {"id": "INS001", "type": "seasonal", "title": "Post-Monsoon Disease Shift", "description": "NLP analysis of 5,000+ articles shows disease burden shifting from waterborne to respiratory infections.", "confidence": 90},
    {"id": "INS002", "type": "trend", "title": "Dengue-Weather Correlation", "description": "Rising humidity (78%) and stagnant water reports in Delhi correlate with 40% increase in dengue mentions.", "confidence": 85},
    {"id": "INS003", "type": "prediction", "title": "Flu Season Forecast", "description": "LSTM model predicts flu cases will peak in 10-14 days across North India.", "confidence": 82},
    {"id": "INS004", "type": "anomaly", "title": "Unusual Malaria Pattern", "description": "Mumbai malaria cases 45% above seasonal average. DBSCAN reveals 3 new micro-hotspots.", "confidence": 78},
]

news_items = [
    {"id": "N001", "title": "Delhi reports 342 dengue cases this week, highest in 3 years", "source": "Times of India", "time": "1h ago", "disease": "Dengue", "severity": "high"},
    {"id": "N002", "title": "ICMR launches new rapid testing kits for dengue detection", "source": "The Hindu", "time": "3h ago", "disease": "Dengue", "severity": "low"},
    {"id": "N003", "title": "Kolkata hospitals see 30% rise in flu cases amid weather change", "source": "Telegraph", "time": "4h ago", "disease": "Flu", "severity": "moderate"},
    {"id": "N004", "title": "WHO warns of increased TB risk in urban slum areas across India", "source": "NDTV", "time": "5h ago", "disease": "TB", "severity": "high"},
    {"id": "N005", "title": "Rajasthan allocates Rs 200 crore for monsoon disease prevention", "source": "Rajasthan Patrika", "time": "6h ago", "disease": "Dengue", "severity": "moderate"},
    {"id": "N006", "title": "Mumbai BMC deploys 500 health workers for malaria control", "source": "Indian Express", "time": "2h ago", "disease": "Malaria", "severity": "moderate"},
]

top_risk_regions = [
    {"rank": 1, "location": "Rohini, Delhi", "disease": "Dengue", "mentions": 249},
    {"rank": 2, "location": "Anand Vihar", "disease": "Flu", "mentions": 195},
    {"rank": 3, "location": "Dharavi, Mumbai", "disease": "TB", "mentions": 178},
    {"rank": 4, "location": "Howrah, Kolkata", "disease": "Dengue", "mentions": 156},
    {"rank": 5, "location": "Whitefield, Bangalore", "disease": "Flu", "mentions": 134},
    {"rank": 6, "location": "Triplicane, Chennai", "disease": "Dengue", "mentions": 112},
]
