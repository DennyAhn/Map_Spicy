# 📁 flask_server/preprocess_api.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from konlpy.tag import Okt
from collections import Counter
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)

okt = Okt()

@app.route('/preprocess', methods=['POST'])
def preprocess():
    try:
        data = request.get_json()
        content = data.get('content', '')
        if not content:
            return jsonify({"error": "내용이 비어있습니다."}), 400

        # 전처리: 명사 추출 + 중복 제거 + 빈도 계산
        nouns = okt.nouns(content)
        keywords = list(set([word for word in nouns if len(word) > 1]))
        counted = Counter(keywords)
        sorted_keywords = counted.most_common(10)

        # 위험 키워드 감지
        danger_words = ['폭행', '성추행', '칼', '위협', '폭탄', '살인', '자해', '테러', '강도']
        detected_words = [kw for kw, count in sorted_keywords if kw in danger_words]
        is_danger = len(detected_words) > 0

        # JSON 파일로 저장
        log_data = {
            "time": datetime.now().isoformat(),
            "original": content,
            "keywords": sorted_keywords,
            "is_danger": is_danger
        }

        with open('keywords_log.json', 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_data, ensure_ascii=False) + '\n')

        return jsonify({
            "keywords": sorted_keywords,
            "is_danger": is_danger
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
