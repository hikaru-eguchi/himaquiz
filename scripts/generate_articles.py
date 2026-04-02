from openai import OpenAI
import os
from datetime import datetime
import pathlib
import re
import random
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

BASE_DIR = pathlib.Path(__file__).resolve().parents[1]
ARTICLE_DIR = BASE_DIR / "src" / "quizbooks_theme"

# 必須テーマ
REQUIRED_THEMES = ["anime", "game"]

# ランダム候補テーマ
OPTIONAL_THEMES = [
    "sports",
    "zatsugaku",
    "food",
    "showa",
    "music",
    "science",
    "character",
    "manga",
]

THEME_LABELS = {
    "anime": "アニメ",
    "game": "ゲーム",
    "sports": "スポーツ",
    "food": "食べ物",
    "zatsugaku": "雑学",
    "showa": "昭和",
    "music": "音楽",
    "science": "科学",
    "character": "キャラクター",
    "manga": "漫画",
}

THEME_TOPIC_EXAMPLES = {
    "anime": [
        "ワンピース",
        "鬼滅の刃",
        "名探偵コナン",
        "ドラゴンボール",
        "ハイキュー!!",
        "進撃の巨人",
        "SPY×FAMILY",
        "呪術廻戦",
        "ドラえもん",
        "クレヨンしんちゃん",
        "ちびまる子ちゃん",
        "ポケモン",
    ],
    "game": [
        "ポケモン",
        "マリオ",
        "ゼルダの伝説",
        "スプラトゥーン",
        "どうぶつの森",
        "ドラゴンクエスト",
        "ファイナルファンタジー",
        "モンスターハンター",
        "星のカービィ",
        "桃太郎電鉄",
        "ぷよぷよ",
        "パズルゲーム全般",
    ],
    "sports": [
        "野球",
        "サッカー",
        "バスケットボール",
        "バレーボール",
        "卓球",
        "テニス",
        "オリンピック",
        "大相撲",
        "陸上競技",
        "フィギュアスケート",
        "スポーツルール雑学",
    ],
    "food": [
        "ラーメン",
        "寿司",
        "カレー",
        "焼肉",
        "和菓子",
        "洋菓子",
        "ご当地グルメ",
        "調味料",
        "ファストフード",
        "給食メニュー",
        "日本の定番料理",
    ],
    "zatsugaku": [
        "ポケモン雑学",
        "国語雑学",
        "日本地理雑学",
        "世界の雑学",
        "身近な科学雑学",
        "歴史雑学",
        "乗り物雑学",
        "ことば雑学",
        "日常生活の雑学",
    ],
    "showa": [
        "昭和の家電",
        "昭和の流行語",
        "昭和のテレビ番組",
        "昭和の学校生活",
        "昭和の遊び",
        "昭和歌謡",
        "昭和の食べ物",
        "昭和の暮らし",
        "昭和レトロ文化",
    ],
    "music": [
        "J-POP",
        "アニソン",
        "昭和歌謡",
        "楽器",
        "クラシック音楽",
        "音楽記号",
        "バンド雑学",
        "ヒット曲",
        "カラオケ定番曲",
    ],
    "science": [
        "宇宙",
        "人体",
        "生き物",
        "天気",
        "化学",
        "物理",
        "地球",
        "恐竜",
        "発明",
        "自然現象",
    ],
    "character": [
        "サンリオ",
        "ディズニー",
        "ドラえもん",
        "ポケモン",
        "すみっコぐらし",
        "ちいかわ",
        "アンパンマン",
        "ミッフィー",
        "クレヨンしんちゃん",
    ],
    "manga": [
        "ワンピース",
        "スラムダンク",
        "キングダム",
        "鬼滅の刃",
        "呪術廻戦",
        "ハンターハンター",
        "進撃の巨人",
        "ドラゴンボール",
        "NARUTO",
        "ちはやふる",
    ],
}

TAG_HINTS = {
    "anime": ["アニメ", "クイズ", "知識", "上級"],
    "game": ["ゲーム", "クイズ", "知識", "上級"],
    "sports": ["スポーツ", "クイズ", "知識", "上級"],
    "food": ["食べ物", "クイズ", "グルメ", "知識"],
    "zatsugaku": ["雑学", "クイズ", "知識", "上級"],
    "showa": ["昭和", "クイズ", "懐かしい", "知識"],
    "music": ["音楽", "クイズ", "知識", "上級"],
    "science": ["科学", "クイズ", "知識", "雑学"],
    "character": ["キャラクター", "クイズ", "知識", "人気"],
    "manga": ["漫画", "クイズ", "知識", "上級"],
}


def safe_filename(title: str) -> str:
    filename = re.sub(r"[^a-zA-Z0-9_\-ぁ-んァ-ン一-龥]", "_", title)
    filename = re.sub(r"_+", "_", filename).strip("_")
    return filename[:80] if filename else "quiz"

def clean_text(value: str) -> str:
    value = value.strip()
    value = value.replace('"', '\\"')
    value = value.replace("\n", " ")
    return value

def remove_code_fence(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"^```markdown\s*", "", text)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()

def normalize_title(title: str) -> str:
    title = remove_code_fence(title)
    title = title.strip().split("\n")[0]
    title = title.replace("「", "").replace("」", "")
    title = title.replace('"', "").replace("'", "")
    title = re.sub(r"^\d+[\.\)]\s*", "", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title

def call_model(prompt: str, model: str = "gpt-4o", temperature: float = 0.7) -> str:
    res = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "あなたは日本語のクイズ記事編集者です。"
                    "SEOに強く、自然な日本語で、"
                    "中級〜やや上級向けのクイズ記事を作るのが得意です。"
                    "事実関係があやしい内容は避け、"
                    "一般によく知られている情報を中心に構成してください。"
                    "出力形式の指示には厳密に従ってください。"
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
    )
    return remove_code_fence(res.choices[0].message.content or "")

def choose_themes() -> list[str]:
    picked_optional = random.sample(OPTIONAL_THEMES, 3)
    return REQUIRED_THEMES + picked_optional

def choose_topic_for_theme(theme: str) -> str:
    return random.choice(THEME_TOPIC_EXAMPLES[theme])

def generate_article_plan(theme: str, topic: str) -> dict:
    theme_label = THEME_LABELS[theme]

    prompt = f"""
あなたはSEO向けクイズ記事の企画編集者です。
以下のテーマと題材に合うクイズ記事の設計情報をJSONで作ってください。

テーマ: {theme}
テーマ表示名: {theme_label}
題材: {topic}

条件:
- クイズは10問
- 難易度は「普通〜やや難しめ」
- 日本語として自然なタイトルにする
- タイトルはクリックされやすいが煽りすぎない
- descriptionは自然なSEO説明文にする
- tagsは5〜7個にする
- tagsは日本語中心でよいが、作品名の英語表記が自然なら含めてよい
- intro_quoteは、記事冒頭の引用ブロックに入る3行の短文にする
- summary_ctaは、最後の一文として自然な締めにする
- 出力はJSONのみ

JSONの形式:
{{
  "title": "...",
  "description": "...",
  "tags": ["...", "..."],
  "intro_quote_lines": ["...", "...", "..."],
  "summary_cta": "..."
}}
"""

    text = call_model(prompt, model="gpt-4o-mini", temperature=0.8)

    try:
        data = json.loads(text)
        return data
    except Exception:
        return {
            "title": f"{topic}好きなら答えたい{theme_label}クイズ10問",
            "description": f"{topic}に関する知識を問う{theme_label}クイズ10問です。普通〜やや難しめの問題で理解度をチェックできます。",
            "tags": [theme_label, topic, "クイズ", "知識", "上級"],
            "intro_quote_lines": [
                f"{topic}好きなら答えたい少し難しめのクイズを10問出題します。",
                "名シーン・設定・ルール・知識などに関する問題に挑戦してみましょう。",
                "細かい部分まで覚えているかがカギになります。",
            ],
            "summary_cta": "次は別ジャンルのクイズにも挑戦してみましょう。",
        }

def generate_quiz_body(theme: str, topic: str, plan: dict) -> str:
    theme_label = THEME_LABELS[theme]

    prompt = f"""
あなたは日本語のクイズ記事ライターです。
以下の条件でMarkdown本文のみを出力してください。

テーマ: {theme}
テーマ表示名: {theme_label}
題材: {topic}
記事タイトル: {plan["title"]}
description: {plan["description"]}

出力ルール:
- frontmatterは出力しない
- Markdown本文のみ
- 冒頭に次の形式の引用ブロックを入れる
- そのあと区切り線 ---
- そのあと「## 問題1」〜「## 問題10」
- 各問題の下に問題文を書く
- その下に必ず <Answer> と </Answer> で答えを書く
- Answerの中は「答え名 + 1〜2文の解説」にする
- 最後に「## まとめ」を入れる
- まとめでは今回のクイズの振り返りを自然な日本語で書く
- 最後の一文は以下をそのまま使う:
{plan["summary_cta"]}

難易度ルール:
- 全体として普通〜やや難しめ
- 超マニアックすぎる問題は避ける
- 初心者すぎる問題だけにもならないようにする
- 10問中、3〜4問くらいは「やや難」でもよい
- 問題文はわかりやすく簡潔にする

品質ルール:
- 事実関係が不安定な内容は避ける
- あいまいな説や論争中の情報は出さない
- 一般的によく知られている設定・ルール・作品知識を中心にする
- ネタバレが強すぎるものは避ける
- 同じタイプの問題が続きすぎないようにする
- 問題はバリエーションを持たせる
- 日本語は自然にする

冒頭引用ブロックに入れる3行:
1. {plan["intro_quote_lines"][0]}
2. {plan["intro_quote_lines"][1]}
3. {plan["intro_quote_lines"][2]}

まとめの方向性:
- 知識の理解度を試せる内容だったと振り返る
- どんな知識が問われたかを2〜3個の箇条書きで整理してよい
- 読み返したくなる自然な締めにする
"""

    return call_model(prompt, model="gpt-4o", temperature=0.75)

def review_quiz_body(theme: str, topic: str, title: str, body: str) -> str:
    prompt = f"""
あなたは日本語のWeb編集者です。
次のクイズ記事本文をレビューしてください。

テーマ: {theme}
題材: {topic}
タイトル: {title}

本文:
{body}

レビュー観点:
- 日本語が不自然ではないか
- 問題の難易度バランス
- 問題の重複感
- 答えの解説が短すぎないか
- 内容が一般知識として不安定ではないか
- Markdown形式の崩れがないか

出力ルール:
- 良い点
- 改善点
- 修正方針
の3つに分けて簡潔に書く
"""
    return call_model(prompt, model="gpt-4o-mini", temperature=0.3)

def improve_quiz_body(theme: str, topic: str, title: str, body: str, review: str) -> str:
    prompt = f"""
あなたは日本語のクイズ記事編集者です。
次のレビューを反映して、本文を自然に改善してください。

テーマ: {theme}
題材: {topic}
タイトル: {title}

元の本文:
{body}

レビュー:
{review}

重要ルール:
- Markdown形式を維持する
- 「## 問題1」〜「## 問題10」を必ず残す
- それぞれに <Answer>〜</Answer> を必ず残す
- 「## まとめ」も必ず残す
- 問題数は10問のまま
- frontmatterは追加しない
- 内容は薄くしない
- 不自然な日本語を直す
- 必要なら問題文や解説を自然に調整する
- 明らかに不安定な内容はより安全な一般知識寄りに修正する

出力:
Markdown本文のみ
"""
    return call_model(prompt, model="gpt-4o", temperature=0.45)

def ensure_tags(theme: str, topic: str, tags: list[str]) -> list[str]:
    base = [topic] + TAG_HINTS.get(theme, [])
    merged = []

    for tag in tags + base:
        tag = str(tag).strip()
        if tag and tag not in merged:
            merged.append(tag)

    return merged[:7]

def build_frontmatter(title: str, description: str, theme: str, tags: list[str], updated: str) -> str:
    safe_title = clean_text(title)
    safe_description = clean_text(description)

    tags_str = ", ".join([f'"{clean_text(t)}"' for t in tags])

    return f"""---
title: "{safe_title}"
description: "{safe_description}"
theme: "{theme}"
tags: [{tags_str}]
updated: "{updated}"
---

"""

def generate_article(theme: str):
    topic = choose_topic_for_theme(theme)
    print(f"🚀 生成開始: theme={theme} / topic={topic}")

    plan = generate_article_plan(theme, topic)

    title = normalize_title(plan.get("title", "")) or f"{topic}好きなら答えたい{THEME_LABELS[theme]}クイズ10問"
    description = plan.get("description", "").strip() or f"{topic}に関する{THEME_LABELS[theme]}クイズ10問です。"
    tags = ensure_tags(theme, topic, plan.get("tags", []))

    if not isinstance(plan.get("intro_quote_lines"), list) or len(plan.get("intro_quote_lines", [])) < 3:
        plan["intro_quote_lines"] = [
            f"{topic}好きなら答えたい少し難しめのクイズを10問出題します。",
            "設定・知識・ルールなどに関する問題に挑戦してみましょう。",
            "細かい部分まで覚えているかがカギになります。",
        ]

    if not plan.get("summary_cta"):
        plan["summary_cta"] = "次は別ジャンルのクイズにも挑戦してみましょう。"

    body = generate_quiz_body(theme, topic, plan)
    review = review_quiz_body(theme, topic, title, body)
    print("🔍 レビュー結果:")
    print(review)

    body = improve_quiz_body(theme, topic, title, body, review)

    updated = datetime.now().strftime("%Y-%m-%d")
    frontmatter = build_frontmatter(title, description, theme, tags, updated)
    content = frontmatter + body.strip() + "\n"

    file_name = safe_filename(title) + ".mdx"
    file_path = ARTICLE_DIR / file_name

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"📝 タイトル: {title}")
    print(f"✅ 保存完了: {file_path}")

def main():
    ARTICLE_DIR.mkdir(parents=True, exist_ok=True)

    selected_themes = choose_themes()
    print("今回生成するテーマ:", selected_themes)

    for theme in selected_themes:
        generate_article(theme)

if __name__ == "__main__":
    main()