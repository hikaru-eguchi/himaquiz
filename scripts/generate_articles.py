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
REQUIRED_THEMES = ["anime"]

# ランダム候補テーマ
OPTIONAL_THEMES = [
    "game",
    "sports",
    "zatsugaku",
    "food",
    "music",
    "science",
    "character",
    "manga",
    "hobby",
]

THEME_LABELS = {
    "anime": "アニメ",
    "game": "ゲーム",
    "sports": "スポーツ",
    "food": "食べ物",
    "zatsugaku": "雑学",
    "music": "音楽",
    "science": "科学",
    "character": "キャラクター",
    "manga": "漫画",
    "hobby": "趣味・生活",
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
        "ジョジョの奇妙な冒険",
        "葬送のフリーレン",
        "推しの子",
        "チェンソーマン",
        "ブルーロック",
        "怪獣8号",
        "薬屋のひとりごと",
        "ぼっち・ざ・ろっく！",
        "Re:ゼロから始める異世界生活",
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
        "ストリートファイター",
        "原神",
        "崩壊：スターレイル",
        "マインクラフト",
        "APEX Legends",
        "フォートナイト",
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
        "プロ野球",
        "Jリーグ",
        "NBA",
        "高校野球",
        "駅伝",
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
        "コンビニグルメ",
        "おにぎり",
        "パン",
        "コーヒー",
        "スイーツ",
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
        "日本文化雑学",
        "学校で習う雑学",
    ],
    "music": [
        "J-POP",
        "アニソン",
        "楽器",
        "クラシック音楽",
        "音楽記号",
        "バンド雑学",
        "ヒット曲",
        "カラオケ定番曲",
        "ボーカロイド",
        "アイドルソング",
        "フェス音楽",
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
        "昆虫",
        "海の生き物",
        "植物",
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
        "ピクサーキャラクター",
        "ゆるキャラ",
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
        "ジョジョの奇妙な冒険",
        "葬送のフリーレン",
        "ブルーロック",
        "怪獣8号",
    ],
    "hobby": [
        "車",
        "スポーツカー",
        "ドライブ",
        "カー用品",
        "洗車",
        "バイク",
        "ツーリング",
        "釣り",
        "海釣り",
        "川釣り",
        "ルアーフィッシング",
        "アウトドア",
        "キャンプ",
        "ソロキャンプ",
        "登山",
        "ハイキング",
        "サウナ",
        "温泉",
        "筋トレ",
        "ランニング",
        "ロードバイク",
        "ガジェット",
        "スマホ",
        "イヤホン",
        "カメラ",
        "旅行",
        "国内旅行",
        "節約術",
        "一人暮らし",
        "日常生活の便利グッズ",
        "DIY",
        "コーヒー",
        "観葉植物",
    ],
}

TAG_HINTS = {
    "anime": ["アニメ", "クイズ", "知識", "上級"],
    "game": ["ゲーム", "クイズ", "知識", "上級"],
    "sports": ["スポーツ", "クイズ", "知識", "上級"],
    "food": ["食べ物", "クイズ", "グルメ", "知識"],
    "zatsugaku": ["雑学", "クイズ", "知識", "上級"],
    "music": ["音楽", "クイズ", "知識", "上級"],
    "science": ["科学", "クイズ", "知識", "雑学"],
    "character": ["キャラクター", "クイズ", "知識", "人気"],
    "manga": ["漫画", "クイズ", "知識", "上級"],
    "hobby": ["趣味", "生活", "クイズ", "知識", "雑学"],
}

TOPIC_SLUG_HINTS = {
    "ワンピース": "one-piece",
    "鬼滅の刃": "kimetsu-no-yaiba",
    "名探偵コナン": "detective-conan",
    "ドラゴンボール": "dragon-ball",
    "ハイキュー!!": "haikyu",
    "進撃の巨人": "attack-on-titan",
    "SPY×FAMILY": "spy-family",
    "呪術廻戦": "jujutsu-kaisen",
    "ドラえもん": "doraemon",
    "クレヨンしんちゃん": "crayon-shinchan",
    "ちびまる子ちゃん": "chibi-maruko-chan",
    "ポケモン": "pokemon",
    "ジョジョの奇妙な冒険": "jojo",
    "葬送のフリーレン": "frieren",
    "推しの子": "oshi-no-ko",
    "チェンソーマン": "chainsaw-man",
    "ブルーロック": "blue-lock",
    "怪獣8号": "kaiju-no-8",
    "薬屋のひとりごと": "kusuriya-no-hitorigoto",
    "ぼっち・ざ・ろっく！": "bocchi-the-rock",
    "Re:ゼロから始める異世界生活": "rezero",
    "マリオ": "mario",
    "ゼルダの伝説": "zelda",
    "スプラトゥーン": "splatoon",
    "どうぶつの森": "animal-crossing",
    "ドラゴンクエスト": "dragon-quest",
    "ファイナルファンタジー": "final-fantasy",
    "モンスターハンター": "monster-hunter",
    "星のカービィ": "kirby",
    "桃太郎電鉄": "momotaro-dentetsu",
    "ぷよぷよ": "puyo-puyo",
    "パズルゲーム全般": "puzzle-game",
    "ストリートファイター": "street-fighter",
    "原神": "genshin",
    "崩壊：スターレイル": "honkai-star-rail",
    "マインクラフト": "minecraft",
    "APEX Legends": "apex-legends",
    "フォートナイト": "fortnite",
    "野球": "baseball",
    "サッカー": "soccer",
    "バスケットボール": "basketball",
    "バレーボール": "volleyball",
    "卓球": "table-tennis",
    "テニス": "tennis",
    "オリンピック": "olympics",
    "大相撲": "sumo",
    "陸上競技": "track-and-field",
    "フィギュアスケート": "figure-skating",
    "スポーツルール雑学": "sports-rules",
    "プロ野球": "pro-baseball",
    "Jリーグ": "j-league",
    "NBA": "nba",
    "高校野球": "high-school-baseball",
    "駅伝": "ekiden",
    "ラーメン": "ramen",
    "寿司": "sushi",
    "カレー": "curry",
    "焼肉": "yakiniku",
    "和菓子": "wagashi",
    "洋菓子": "western-sweets",
    "ご当地グルメ": "local-gourmet",
    "調味料": "seasoning",
    "ファストフード": "fast-food",
    "給食メニュー": "school-lunch",
    "日本の定番料理": "japanese-food",
    "コンビニグルメ": "convenience-store-food",
    "おにぎり": "onigiri",
    "パン": "bread",
    "コーヒー": "coffee",
    "スイーツ": "sweets",
    "ポケモン雑学": "pokemon-trivia",
    "国語雑学": "japanese-language-trivia",
    "日本地理雑学": "japan-geography-trivia",
    "世界の雑学": "world-trivia",
    "身近な科学雑学": "science-trivia",
    "歴史雑学": "history-trivia",
    "乗り物雑学": "vehicle-trivia",
    "ことば雑学": "word-trivia",
    "日常生活の雑学": "daily-life-trivia",
    "日本文化雑学": "japanese-culture-trivia",
    "学校で習う雑学": "school-trivia",
    "J-POP": "j-pop",
    "アニソン": "anime-song",
    "楽器": "musical-instruments",
    "クラシック音楽": "classical-music",
    "音楽記号": "music-symbols",
    "バンド雑学": "band-trivia",
    "ヒット曲": "hit-songs",
    "カラオケ定番曲": "karaoke-songs",
    "ボーカロイド": "vocaloid",
    "アイドルソング": "idol-song",
    "フェス音楽": "festival-music",
    "宇宙": "space",
    "人体": "human-body",
    "生き物": "animals",
    "天気": "weather",
    "化学": "chemistry",
    "物理": "physics",
    "地球": "earth",
    "恐竜": "dinosaurs",
    "発明": "inventions",
    "自然現象": "natural-phenomena",
    "昆虫": "insects",
    "海の生き物": "sea-creatures",
    "植物": "plants",
    "サンリオ": "sanrio",
    "ディズニー": "disney",
    "すみっコぐらし": "sumikko-gurashi",
    "ちいかわ": "chiikawa",
    "アンパンマン": "anpanman",
    "ミッフィー": "miffy",
    "スラムダンク": "slam-dunk",
    "キングダム": "kingdom",
    "ハンターハンター": "hunter-hunter",
    "NARUTO": "naruto",
    "ちはやふる": "chihayafuru",
    "車": "car",
    "スポーツカー": "sports-car",
    "ドライブ": "driving",
    "カー用品": "car-accessories",
    "洗車": "car-wash",
    "バイク": "motorbike",
    "ツーリング": "touring",
    "釣り": "fishing",
    "海釣り": "sea-fishing",
    "川釣り": "river-fishing",
    "ルアーフィッシング": "lure-fishing",
    "アウトドア": "outdoor",
    "キャンプ": "camping",
    "ソロキャンプ": "solo-camping",
    "登山": "mountain-climbing",
    "ハイキング": "hiking",
    "サウナ": "sauna",
    "温泉": "hot-spring",
    "筋トレ": "workout",
    "ランニング": "running",
    "ロードバイク": "road-bike",
    "ガジェット": "gadgets",
    "スマホ": "smartphone",
    "イヤホン": "earphones",
    "カメラ": "camera",
    "旅行": "travel",
    "国内旅行": "domestic-travel",
    "節約術": "saving-money",
    "一人暮らし": "living-alone",
    "日常生活の便利グッズ": "daily-goods",
    "DIY": "diy",
    "観葉植物": "houseplants",
}


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


def slugify_ascii(text: str) -> str:
    text = text.lower().strip()
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9\s\-]", " ", text)
    text = re.sub(r"[\s\-]+", "-", text).strip("-")
    return text[:80] if text else "quiz"


def ensure_unique_filepath(directory: pathlib.Path, slug: str, ext: str = ".mdx") -> pathlib.Path:
    path = directory / f"{slug}{ext}"
    if not path.exists():
        return path

    i = 2
    while True:
        path = directory / f"{slug}-{i}{ext}"
        if not path.exists():
            return path
        i += 1


def get_existing_topics() -> set[str]:
    topics = set()

    if not ARTICLE_DIR.exists():
        return topics

    for path in ARTICLE_DIR.glob("*.mdx"):
        try:
            text = path.read_text(encoding="utf-8")

            # frontmatterの topic: "..." を拾う
            match = re.search(r'^topic:\s*"(.+?)"', text, re.MULTILINE)
            if match:
                topics.add(match.group(1).strip())
        except Exception:
            continue

    return topics

EXISTING_TOPICS_CACHE = get_existing_topics()

def is_topic_already_used(topic: str) -> bool:
    return topic.strip() in EXISTING_TOPICS_CACHE


def call_model(prompt: str, model: str = "gpt-4o", temperature: float = 0.7) -> str:
    res = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "あなたは日本語のクイズ記事編集者です。"
                    "SEOに強く、自然な日本語で、"
                    "難易度設計のあるクイズ記事を作るのが得意です。"
                    "事実関係があやしい内容は避け、"
                    "一般によく知られている情報からコアファン向け知識まで、"
                    "段階的に構成してください。"
                    "出力形式の指示には厳密に従ってください。"
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
    )
    return remove_code_fence(res.choices[0].message.content or "")


def choose_themes() -> list[str]:
    picked_optional = random.sample(OPTIONAL_THEMES, 4)
    return REQUIRED_THEMES + picked_optional


def generate_topic_with_ai(theme: str) -> str:
    theme_label = THEME_LABELS.get(theme, theme)
    fallback_candidates = THEME_TOPIC_EXAMPLES.get(theme, [])
    fallback_topic = random.choice(fallback_candidates) if fallback_candidates else f"{theme_label}知識"
    popular_examples = "、".join(fallback_candidates[:12]) if fallback_candidates else theme_label

    prompt = f"""
あなたはクイズ企画者です。
以下のテーマに合う「クイズ題材」を1つだけ提案してください。

テーマ: {theme}
テーマ表示名: {theme_label}

人気候補の参考:
{popular_examples}

条件:
- 実在する作品・分野・ジャンルにする
- クイズにしやすい題材にする
- 人気や検索需要が見込めるものを優先する
- 日本語として自然にする
- 曖昧すぎる題材は避ける
- すでに作成済みの題材は避ける
- 同じ作品・題材の重複生成は避ける
- そのテーマの中で特化記事になりやすい題材にする
- 広すぎる言葉より、やや特化した題材を優先する
- ただしマニアックすぎて検索されなそうな題材は避ける
- 既存の人気候補と完全一致でもよいし、近い具体化でもよい
- 1つだけ出力する
- 余計な説明は書かない
- 題材名のみ出力する

よい例:
ジョジョの奇妙な冒険
葬送のフリーレン
プロ野球
コンビニグルメ
ソロキャンプ
ルアーフィッシング
"""

    topic = call_model(prompt, model="gpt-4o-mini", temperature=0.95)
    topic = normalize_title(topic)

    return topic or fallback_topic


def choose_topic_for_theme(theme: str) -> str:
    fixed_candidates = THEME_TOPIC_EXAMPLES.get(theme, [])

    # まず固定候補をシャッフルして、未使用のものを探す
    shuffled_fixed = fixed_candidates[:]
    random.shuffle(shuffled_fixed)

    # 30%は固定候補優先
    if shuffled_fixed and random.random() < 0.30:
        for topic in shuffled_fixed:
            if not is_topic_already_used(topic):
                return topic

    # 70%はAI生成を優先、ただし重複は避ける
    for _ in range(5):
        ai_topic = generate_topic_with_ai(theme)
        if ai_topic and not is_topic_already_used(ai_topic):
            return ai_topic

    # 固定候補の中から未使用を探す
    for topic in shuffled_fixed:
        if not is_topic_already_used(topic):
            return topic

    # どうしても全部使い切っていたら最後の保険
    if fixed_candidates:
        return random.choice(fixed_candidates)

    return f"{THEME_LABELS.get(theme, theme)}知識"


def generate_click_title(theme: str, topic: str, question_count: int = 15) -> str:
    theme_label = THEME_LABELS[theme]

    prompt = f"""
あなたはSEOとクリック率に強い日本語Web編集者です。
以下の題材に対して、クリックされやすい記事タイトルを1つだけ作ってください。

テーマ: {theme}
テーマ表示名: {theme_label}
題材: {topic}

条件:
- 日本語として自然
- クリック率を意識する
- 強い引きがある
- ただし過剰な煽りは禁止
- 「クイズ」と「{question_count}問」を必ず含める
- 25〜45文字くらい
- 題材名が自然に入るなら入れる
- 「9割が間違える」「意外と知らない」「ファンでも迷う」などの方向性は可
- 下品・不自然・誇大表現は禁止
- タイトルのみ1行で出力

例:
ファンでも意外と間違えるワンピースクイズ15問
ポケモン好きでも迷う知識クイズ15問
意外と知らないサウナクイズ15問
"""

    title = normalize_title(call_model(prompt, model="gpt-4o-mini", temperature=0.9))
    return title or f"{topic}好きでも迷う{theme_label}クイズ{question_count}問"


def generate_article_plan(theme: str, topic: str) -> dict:
    theme_label = THEME_LABELS[theme]

    prompt = f"""
あなたはSEO向けクイズ記事の企画編集者です。
以下のテーマと題材に合うクイズ記事の設計情報をJSONで作ってください。

テーマ: {theme}
テーマ表示名: {theme_label}
題材: {topic}

条件:
- クイズは15問
- 難易度構成は以下
  - 1〜2問: 超簡単問題
  - 3〜5問: 普通レベル問題
  - 6〜10問: 上級レベルの知識問題
  - 11〜15問: マニア向け問題
- descriptionは自然なSEO説明文にする
- tagsは5〜7個にする
- tagsは日本語中心でよいが、作品名の英語表記が自然なら含めてよい
- intro_quoteは、記事冒頭の引用ブロックに入る3行の短文にする
- summary_ctaは、最後の一文として自然な締めにする
- seo_intro_keywords は導入で自然に触れたい関連語を2〜4個
- seo_summary_keywords はまとめで自然に触れたい関連語を2〜4個
- 出力はJSONのみ

JSONの形式:
{{
  "description": "...",
  "tags": ["...", "..."],
  "intro_quote_lines": ["...", "...", "..."],
  "summary_cta": "...",
  "seo_intro_keywords": ["...", "..."],
  "seo_summary_keywords": ["...", "..."]
}}
"""

    text = call_model(prompt, model="gpt-4o-mini", temperature=0.8)

    try:
        data = json.loads(text)
        return data
    except Exception:
        return {
            "description": f"{topic}に関する知識を問う{theme_label}クイズ15問です。前半は一般常識寄り、中盤は上級、後半は超マニアック問題まで幅広く楽しめます。",
            "tags": [theme_label, topic, "クイズ", "知識", "上級"],
            "intro_quote_lines": [
                f"{topic}好きでも迷う{theme_label}クイズを15問出題します。",
                "前半は一般常識寄り、中盤以降は知識差が出る問題構成です。",
                "最後の超マニアック問題までどこまで解けるか挑戦してみてください。",
            ],
            "summary_cta": "次は別ジャンルのクイズにも挑戦してみましょう。",
            "seo_intro_keywords": [topic, f"{theme_label}クイズ"],
            "seo_summary_keywords": ["知識チェック", "暇つぶし"],
        }


def generate_slug(theme: str, topic: str, title: str) -> str:
    topic_hint = TOPIC_SLUG_HINTS.get(topic)

    if topic_hint:
        base = f"{topic_hint}-{theme}-quiz"
        return slugify_ascii(base)

    prompt = f"""
あなたはSEO向けURL slug作成者です。
以下の記事のファイル名用slugを1つだけ作ってください。

テーマ: {theme}
題材: {topic}
タイトル: {title}

条件:
- 英小文字のみ
- 単語区切りはハイフン
- 3〜8語くらい
- 意味が通る自然なslug
- 日本語は使わない
- 拡張子は付けない
- 余計な説明は不要
- slugのみ1行で出力

例:
one-piece-anime-quiz
pokemon-zatsugaku-quiz
baseball-sports-quiz
sauna-hobby-quiz
"""

    slug = call_model(prompt, model="gpt-4o-mini", temperature=0.2)
    return slugify_ascii(slug)


def generate_quiz_body(theme: str, topic: str, plan: dict) -> str:
    theme_label = THEME_LABELS[theme]
    intro_keywords = ", ".join(plan.get("seo_intro_keywords", []))
    summary_keywords = ", ".join(plan.get("seo_summary_keywords", []))

    prompt = f"""
あなたは日本語のクイズ記事ライターです。
以下の条件でMarkdown本文のみを出力してください。

テーマ: {theme}
テーマ表示名: {theme_label}
題材: {topic}
description: {plan["description"]}

出力ルール:
- frontmatterは出力しない
- Markdown本文のみ
- まず引用ブロックの前に、導入文を2〜4段落入れる
- 導入文では、この記事でどんな知識が試せるかを自然に説明する
- そのあとに次の形式の引用ブロックを入れる
- そのあと区切り線 ---
- そのあと「## 問題1」〜「## 問題15」
- 各問題の下に問題文を書く
- その下に必ず <Answer> と </Answer> で答えを書く
- Answerの中は「答え名 + 2〜4文の解説」にする
- 解説では、答えの理由・背景・関連知識を自然に補足する
- 最後に「## まとめ」を入れる
- まとめは短すぎないように、4〜8段落程度で自然に締める
- まとめでは今回のクイズの振り返りを自然な日本語で書く
- 必要に応じて箇条書きを使って読みやすくしてよい
- 最後の一文は以下をそのまま使う:
{plan["summary_cta"]}

難易度ルール:
- 問題数は必ず15問
- 1〜2問目は超簡単問題にする
- 3〜5問目は普通レベル問題にする
- 6〜10問目は上級レベルの知識問題にする
- 11〜15問目はマニア向け問題にする
- 最初から最後まで段階的に難しくなる構成にする
- 1問目と2問目は、その作品や題材を知っている人ならほぼ答えられる内容にする
- 3〜5問目は、知っていれば解けるが少し考える内容にする
- 6〜10問目は、しっかり知識がある人向けにする
- 11〜15問目は、コアファンや詳しい人でないと難しい内容にする

品質ルール:
- 1〜2問目は簡単でよい
- ただし簡単すぎても、題材に関係ない問題にはしない
- 3〜5問目は普通レベルとして成立させる
- 6〜10問目は知識差が出る問題にする
- 11〜15問目はかなり深い知識を問ってよい
- 難易度の逆転は禁止（後半より前半のほうが難しい構成にしない）
- 事実関係が不安定な内容は避ける
- あいまいな説や論争中の情報は出さない
- 一般的によく知られている設定・ルール・作品知識から、コアファン向け知識まで段階的に出題する
- 同じタイプの問題が続きすぎないようにする
- 問題はバリエーションを持たせる
- 日本語は自然にする
- 各問題は必ず「答えが1つに明確に定まる形式」にする
- 主観・説明問題は禁止（例：「〜について説明せよ」はNG）
- 「最も〜」「〜とされる」など曖昧な表現は禁止
- 答えが複数あり得る問題は禁止
- すべての問題は一問一答形式にする
- 問題は以下のいずれかの形式のみ許可する
  1. 人物名を答える問題
  2. 地名・組織名を答える問題
  3. 技・能力・名称を答える問題
  4. 数値・回数・順番を答える問題
  - 問題文は必ず「1つの明確な固有名詞 or 数値」を答えさせる形式にする
- 「どれ？」「何？」ではなく「〇〇は何という名前？」形式にする
- 選択式は禁止
- 同じ形式の問題が3問以上連続しないようにする
- 人物・技・出来事・時系列などをバランスよく混ぜる
- 抽象的な問いは禁止
- 必ず固有名詞・数値・名称など、明確に特定できる答えにする
- 明確に誤答しやすいひっかけだけに頼らない
- 本当に知識差が出る問題構成にする

SEOルール:
- 導入では次の関連語を不自然にならない範囲で自然に触れてよい: {intro_keywords}
- まとめでは次の関連語を不自然にならない範囲で自然に触れてよい: {summary_keywords}
- SEOっぽすぎる不自然な連呼はしない
- 読み物として自然な範囲で情報量を増やす

冒頭引用ブロックに入れる3行:
1. {plan["intro_quote_lines"][0]}
2. {plan["intro_quote_lines"][1]}
3. {plan["intro_quote_lines"][2]}

まとめの方向性:
- 知識の理解度を試せる内容だったと振り返る
- どんな知識が問われたかを2〜4個の箇条書きで整理してよい
- 読み返したくなる自然な締めにする
"""

    return call_model(prompt, model="gpt-4o", temperature=0.7)


def fact_check_quiz_body(theme: str, topic: str, title: str, body: str) -> str:
    prompt = f"""
あなたはクイズ記事のファクトチェッカーです。
以下のクイズ本文について、各問題と答えの正当性を確認してください。

テーマ: {theme}
題材: {topic}
タイトル: {title}

本文:
{body}

確認ルール:
- 問題ごとに「正確」「やや不正確」「不正確」「曖昧」のどれかで判定
- 不正確または曖昧なら、どこが問題か具体的に指摘
- 答えが一意でない問題は「不正確」と判定する
- 曖昧な問いは必ず修正対象にする
- より安全で一般的な表現への修正案を書く
- 事実関係が揺れやすいものは、より安定した問題に差し替える提案をしてよい
- 問題番号ごとに分ける
- 問題15まで確認する
- 出力はMarkdownで簡潔に
"""
    return call_model(prompt, model="gpt-4o", temperature=0.2)


def fix_quiz_by_fact_check(theme: str, topic: str, title: str, body: str, fact_review: str) -> str:
    prompt = f"""
あなたはクイズ記事編集者です。
以下のファクトチェック結果を反映して、クイズ本文を修正してください。

テーマ: {theme}
題材: {topic}
タイトル: {title}

元の本文:
{body}

ファクトチェック結果:
{fact_review}

重要ルール:
- Markdown形式を維持する
- 「## 問題1」〜「## 問題15」を必ず残す
- それぞれに <Answer>〜</Answer> を必ず残す
- 「## まとめ」も必ず残す
- 問題数は15問のまま
- 難易度構成を壊さない
  - 1〜2問: 超簡単
  - 3〜5問: 普通
  - 6〜10問: 上級
  - 11〜15問: マニア
- frontmatterは追加しない
- 不正確または曖昧な箇所を優先修正する
- より安全で一般的に正しい知識に寄せる
- 問い自体が悪い場合は、同テーマ内で自然な別問題に差し替えてよい
- 本文全体を不必要に短くしない

出力:
Markdown本文のみ
"""
    return call_model(prompt, model="gpt-4o", temperature=0.2)


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
- 15問の流れとして自然か
- 1〜5問目が一般常識として機能しているか
- 6〜10問目が上級レベルとして成立しているか
- 11〜15問目が超マニアックとして成立しているか
- 問題の重複感
- 解説が薄すぎないか
- 導入とまとめが短すぎないか
- 読みやすさは十分か
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
- 「## 問題1」〜「## 問題15」を必ず残す
- それぞれに <Answer>〜</Answer> を必ず残す
- 「## まとめ」も必ず残す
- 問題数は15問のまま
- frontmatterは追加しない
- 内容は薄くしない
- 不自然な日本語を直す
- 導入とまとめが弱ければ自然に補強する
- 必要なら問題文や解説を自然に調整する
- 冗長すぎる箇所は整理する
- 難易度構成は壊さない
  - 1〜2問: 超簡単
  - 3〜5問: 普通
  - 6〜10問: 上級
  - 11〜15問: マニア

出力:
Markdown本文のみ
"""
    return call_model(prompt, model="gpt-4o", temperature=0.45)


def expand_for_seo(theme: str, topic: str, title: str, body: str) -> str:
    prompt = f"""
あなたはSEOに強い日本語編集者です。
以下のクイズ記事本文を、自然さを保ったまま少し厚くしてください。

テーマ: {theme}
題材: {topic}
タイトル: {title}

本文:
{body}

目的:
- 情報量を増やす
- 解説を少し丁寧にする
- 導入とまとめを少し厚くする
- 読みやすさを保つ
- 冗長にはしない

重要ルール:
- 問題数は変えない
- 「## 問題1」〜「## 問題15」を残す
- <Answer>〜</Answer> を残す
- 「## まとめ」を残す
- frontmatterは追加しない
- SEOっぽすぎる不自然な言い回しは避ける
- 難易度構成は壊さない
  - 1〜2問: 超簡単
  - 3〜5問: 普通
  - 6〜10問: 上級
  - 11〜15問: マニア

出力:
Markdown本文のみ
"""
    return call_model(prompt, model="gpt-4o", temperature=0.35)


def ensure_tags(theme: str, topic: str, tags: list[str]) -> list[str]:
    base = [topic] + TAG_HINTS.get(theme, [])
    merged = []

    for tag in tags + base:
        tag = str(tag).strip()
        if tag and tag not in merged:
            merged.append(tag)

    return merged[:7]


def build_frontmatter(
    title: str,
    description: str,
    theme: str,
    tags: list[str],
    updated: str,
    slug: str,
    topic: str,
) -> str:
    safe_title = clean_text(title)
    safe_description = clean_text(description)
    safe_slug = clean_text(slug)
    safe_topic = clean_text(topic)
    tags_str = ", ".join([f'"{clean_text(t)}"' for t in tags])

    return f"""---
title: "{safe_title}"
description: "{safe_description}"
theme: "{theme}"
topic: "{safe_topic}"
slug: "{safe_slug}"
tags: [{tags_str}]
updated: "{updated}"
---

"""


def generate_article(theme: str):
    topic = choose_topic_for_theme(theme)
    print(f"🚀 生成開始: theme={theme} / topic={topic}")

    plan = generate_article_plan(theme, topic)

    title = generate_click_title(theme, topic, question_count=15)
    description = plan.get("description", "").strip() or f"{topic}に関する{THEME_LABELS[theme]}クイズ15問です。"
    tags = ensure_tags(theme, topic, plan.get("tags", []))

    if not isinstance(plan.get("intro_quote_lines"), list) or len(plan.get("intro_quote_lines", [])) < 3:
        plan["intro_quote_lines"] = [
            f"{topic}好きでも迷う少し難しめのクイズを15問出題します。",
            "前半は一般常識寄り、中盤以降は知識差が出る問題構成です。",
            "最後の超マニアック問題までどこまで解けるか挑戦してみましょう。",
        ]

    if not plan.get("summary_cta"):
        plan["summary_cta"] = "次は別ジャンルのクイズにも挑戦してみましょう。"

    if not isinstance(plan.get("seo_intro_keywords"), list):
        plan["seo_intro_keywords"] = [topic, f"{THEME_LABELS[theme]}クイズ"]

    if not isinstance(plan.get("seo_summary_keywords"), list):
        plan["seo_summary_keywords"] = ["知識チェック", "暇つぶし"]

    body = generate_quiz_body(theme, topic, plan)

    fact_review = fact_check_quiz_body(theme, topic, title, body)
    print("🧪 ファクトチェック:")
    print(fact_review)

    body = fix_quiz_by_fact_check(theme, topic, title, body, fact_review)

    review = review_quiz_body(theme, topic, title, body)
    print("🔍 レビュー結果:")
    print(review)

    body = improve_quiz_body(theme, topic, title, body, review)
    body = expand_for_seo(theme, topic, title, body)

    slug = generate_slug(theme, topic, title)
    updated = datetime.now().strftime("%Y-%m-%d")
    frontmatter = build_frontmatter(title, description, theme, tags, updated, slug, topic)
    content = frontmatter + body.strip() + "\n"

    file_path = ensure_unique_filepath(ARTICLE_DIR, slug, ".mdx")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"📝 タイトル: {title}")
    print(f"🔗 slug: {slug}")
    print(f"✅ 保存完了: {file_path}")


def main():
    ARTICLE_DIR.mkdir(parents=True, exist_ok=True)

    selected_themes = choose_themes()
    print("今回生成するテーマ:", selected_themes)

    for theme in selected_themes:
        generate_article(theme)


if __name__ == "__main__":
    main()