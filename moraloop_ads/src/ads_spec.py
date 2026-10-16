"""All 52 Moraloop question ads. Wording follows Moraloop_All_Recovered_Ad_Questions.pdf."""


def M(text, **kw):
    return ("man", text, kw)


def S(text, chars, act, icons=(), react="shock", **kw):
    return ("scene", text, dict(chars=list(chars), act=act, icons=list(icons), react=react, **kw))


WWYD = "What would you do?"
STAND = "Find out where you stand."

ADS = [
    # ---------------- Latest approved additions and retained creative
    dict(id="01_your_brother", title="Your Brother", beats=[
        M("Cheating is cheating. I’d tell my friend."),
        S("But the person who cheated is your brother.", ["brother", "you"], "say", ["💋", "💔"], "shock"),
        M("Same principle. Different person."),
    ], close="Still so sure?", outro=STAND),

    dict(id="02_the_school_garden", title="The School Garden", beats=[
        S("One empty school yard. Some want a food garden. Others want a place to play. You help choose.",
          ["kid", "you", "cousin"], "react", ["🥕", "⚽"], "worried", others="happy"),
        M("Do you make a garden for growing food, or make a play space for everyone?",
          cards=("Make a garden for growing food.", "Make a play space for everyone.")),
        S("The school gets ten plants. One class wants them at home. Another wants them in the shared yard.",
          ["kid", "you"], "give", ["🪴", "🏠", "🏫"], "worried"),
        M("Do you give plants to the class to care for, or plant them where everyone can enjoy them?",
          cards=("Give plants to the class to care for.", "Plant them where everyone can enjoy them.")),
    ], close=WWYD),

    dict(id="03_the_phone_swap", title="The Phone Swap", beats=[
        S("Your partner slides an unlocked phone across the table. “Swap phones. No secrets.”",
          ["partner", "you"], "give", ["📱", "🔓"], "worried"),
        S("But your phone holds a friend’s private messages.", ["you"], "see", ["📱", "🤫", "💬"], "worried"),
        M("Do you talk instead, or offer a limited look?", cards=("Talk, don’t swap", "Offer a limited look")),
        S("Then your screen lights up. “Please don’t tell anyone yet.” Your partner wants to read that chat.",
          ["partner", "you"], "see", ["📱", "🙏", "🤐"], "shock", others="smug"),
        M("Do you ask your friend what you can share, or keep it private?",
          cards=("Ask your friend what you can share", "Keep the chat private")),
    ], close="Two more decisions. Where would you draw the line?"),

    dict(id="04_the_ex_plus_one", title="The Ex Plus One", beats=[
        S("Your partner’s ex needs a wedding date. “Just one evening. We already said we’d go.”",
          ["ex", "partner", "you"], "say", ["💒", "💃"], "worried"),
        S("You’re not invited.", ["you"], "think", ["💌", "❌"]),
        M("Do you say you’re uncomfortable, or support the one-night plan?",
          cards=("Say you’re uncomfortable", "Support the one-night plan")),
        S("Then the ex adds, “My family still thinks we’re together. Can we leave it that way for one night?”",
          ["ex", "partner", "you"], "say", ["👨‍👩‍👧", "💑", "🤫"], "shock"),
        M("Do you ask your partner to decline, or ask them to tell the truth?",
          cards=("Ask them to decline", "Ask them to tell the truth")),
    ], close="Two more decisions. What would you choose?"),

    dict(id="05_the_group_chat_relationship", title="The Group Chat", beats=[
        S("You’re at game night when your partner’s friend quotes your private argument. Everyone laughs.",
          ["friend", "friend2", "you"], "laugh", ["🎲", "🗯️"], "sad"),
        S("You never told them.", ["you"], "think", ["🤐", "❓"]),
        M("Do you ask in front of everyone, or speak to your partner privately?",
          cards=("Ask in front of everyone", "Speak to your partner privately")),
        S("Your partner says, “I needed advice.” Then you find out they sent screenshots. Even your apology.",
          ["partner", "you"], "see", ["📱", "📸", "🙏"], "shock", others="worried"),
        M("Do you ask for the screenshots to be removed, or ask them to correct the story?",
          cards=("Ask them to remove the screenshots", "Ask them to correct the story")),
    ], close="Two more decisions. What would you choose?"),

    dict(id="06_the_missing_deposit", title="The Missing Deposit", beats=[
        S("You’re about to move in together. Then your partner says their deposit money is gone.",
          ["partner", "you"], "say", ["🏠", "💸"], "shock"),
        S("They gave it to a sibling for rent.", ["partner", "you"], "tell", ["👦", "💵"], "worried"),
        M("Do you delay the move, or cover the gap once?", cards=("Delay the move", "Cover the gap once")),
        S("Then a thank-you message arrives. “Thanks for paying our rent again.” Again?",
          ["partner", "you"], "see", ["📱", "🙏", "🔁"], "shock", others="worried"),
        M("This wasn’t a one-off. Do you ask for the full money picture, or pause the move-in plan?",
          cards=("Ask for the full money picture", "Pause the move-in plan")),
    ], close="Two more decisions. What would you choose?"),

    # ---------------- Saved favorites
    dict(id="07_the_wallet", title="The Wallet", beats=[
        S("You find a wallet full of cash.", ["you"], "see", ["👛", "💵"], "happy"),
        M("Of course I’d return it."),
        S("But your rent is due tonight, and you’re short.", ["you"], "think", ["🏠", "⏰", "💸"]),
    ], close="Still so sure?", outro=STAND),

    dict(id="08_the_resume", title="The Résumé", beats=[
        M("Lying on a résumé is wrong."),
        S("But your partner needs that job to keep you from losing your home.",
          ["partner", "you"], "say", ["💼", "🏠"], "worried"),
    ], close="Would you expose the lie?", outro=STAND),

    dict(id="09_the_message", title="The Message", beats=[
        M("I’d never read my partner’s messages."),
        S("Then you accidentally see a message proving they lied.", ["you"], "see", ["📱", "🤥", "💬"], "shock"),
    ], close="Do you keep reading?", outro=STAND),

    dict(id="10_the_cover_story", title="The Cover Story", beats=[
        M("I’d always tell someone they’re being cheated on."),
        S("But your best friend is cheating and asks you to cover for them.",
          ["friend", "you"], "tell", ["💋", "🤫", "🙏"], "shock"),
    ], close="Do you tell their partner?", outro=STAND),

    # ---------------- Earlier chain of events videos
    dict(id="11_the_neighborhood_game", title="The Neighborhood Game", beats=[
        S("One friend can play only in the morning. Most of the group wants an afternoon game.",
          ["kid", "you", "cousin"], "react", ["🌅", "⚽", "🌇"], "worried"),
        M("Do you pick morning so that friend can join, or pick afternoon for the larger group?",
          cards=("Pick morning so that friend can join.", "Pick afternoon for the larger group.")),
        S("Only one ball is left. A new player asks to borrow it. Your regular group needs it too.",
          ["cousin", "you"], "say", ["⚽", "🙏"], "worried"),
        M("Do you lend it to the new player, or keep it for the regular group?",
          cards=("Lend it to the new player.", "Keep it for the regular group.")),
    ], close=WWYD),

    dict(id="12_the_broken_gift", title="The Broken Gift", beats=[
        S("Your cousin breaks a gift your sibling loves. Scared of getting in trouble, they ask you not to tell.",
          ["cousin", "you"], "tell", ["🎁", "💥", "🤫"], "shock"),
        M("Do you tell your sibling what happened, or help your cousin fix it first?",
          cards=("Tell your sibling what happened.", "Help your cousin fix it first.")),
        S("Your sibling suspects someone else. They may be blamed at dinner. Your cousin is afraid to speak.",
          ["sibling", "you", "cousin"], "say", ["🤨", "🍽️"], "worried", others="worried"),
        M("Do you tell your sibling the truth, or give your cousin one more chance to speak?",
          cards=("Tell your sibling the truth.", "Give your cousin one more chance to speak.")),
    ], close=WWYD),

    dict(id="13_the_team_project", title="The Team Project", beats=[
        S("One entry for the fair. Your friend has a bold idea. A quiet teammate has a safer one.",
          ["friend", "you", "teammate"], "react", ["🚀", "🛡️"], "worried"),
        M("Do you choose your friend’s bold idea, or choose the safer idea?",
          cards=("Choose your friend’s bold idea.", "Choose the safer idea.")),
        S("A teammate did little work but wants their name on the project. They promise to help next time.",
          ["teammate", "you"], "say", ["📝", "🙏"], "angry"),
        M("Do you give them credit this time, or credit only those who helped?",
          cards=("Give them credit this time.", "Credit only those who helped.")),
    ], close=WWYD),

    dict(id="14_the_private_message", title="The Private Message", beats=[
        S("A friend leaves their phone. A message pops up: another friend feels left out. You haven’t opened it.",
          ["you"], "see", ["📱", "😔", "💬"], "worried"),
        M("Do you tell your friend what you saw, or wait for them to read it themselves?",
          cards=("Tell your friend what you saw.", "Wait for them to read it themselves.")),
        S("The sender asks why no one replied. You know the phone was left behind. Its owner asked for privacy.",
          ["friend2", "you"], "say", ["💬", "❓"], "worried"),
        M("Do you explain that the phone was left behind, or tell them to ask the owner directly?",
          cards=("Explain that the phone was left behind.", "Tell them to ask the owner directly.")),
    ], close=WWYD),

    dict(id="15_the_lost_wallet", title="The Lost Wallet", beats=[
        S("A wallet has cash and ID. Your friend knows its owner and offers to return it. Can you trust them?",
          ["friend", "you"], "say", ["👛", "🪪"], "worried"),
        M("Do you give it to your friend to return, or take it to a safe lost-and-found spot?",
          cards=("Give it to your friend to return.", "Take it to a safe lost-and-found spot.")),
        S("The owner says cash is missing. You took none. Your friend had the wallet alone for a few minutes.",
          ["stranger", "you", "friend"], "say", ["👛", "💸", "❓"], "shock"),
        M("Do you tell the owner what you saw, or ask your friend what happened first?",
          cards=("Tell the owner what you saw.", "Ask your friend what happened first.")),
    ], close=WWYD),

    dict(id="16_the_community_meal", title="The Community Meal", beats=[
        S("Enough food for one meal. A shelter needs it tonight. Volunteers want to save it for a bigger event tomorrow.",
          ["friend2", "you", "stranger"], "react", ["🍲", "🏠", "📅"], "worried"),
        M("Do you serve the shelter tonight, or save it for tomorrow’s event?",
          cards=("Serve the shelter tonight.", "Save it for tomorrow’s event.")),
        S("A store offers free food near its sell-by date. Collecting it would cost volunteers their day off.",
          ["stranger", "you"], "say", ["🥖", "📆", "😴"], "worried"),
        M("Do you ask volunteers to collect it, or respect their day off?",
          cards=("Ask volunteers to collect it.", "Respect their day off.")),
    ], close=WWYD),

    dict(id="17_the_night_reading_room", title="The Night Reading Room", beats=[
        S("One extra library evening. Students and care workers need different nights. The budget covers one.",
          ["kid", "you", "elder"], "react", ["📚", "🎓", "🩺"], "worried"),
        M("Do you choose the evening most useful to students, or the evening most useful to care workers?",
          cards=("Choose the evening most useful to students.", "Choose the evening most useful to care workers.")),
        S("Free public readings need the private study room during normal weekend hours. Open to everyone.",
          ["elder", "you"], "say", ["📖", "🚪"], "worried"),
        M("Do you reserve the room for the free reading series, or keep the room available for private study?",
          cards=("Reserve the room for the free reading series.", "Keep the room available for private study.")),
    ], close=WWYD),

    dict(id="18_the_team_secret", title="The Team Secret", beats=[
        S("Your teammate may quit. They ask for secrecy. The team is making plans around them.",
          ["teammate", "you"], "tell", ["🏃", "🚪", "🤫"], "shock"),
        M("Do you tell the coach the team needs a backup, or keep your teammate’s secret for now?",
          cards=("Tell the coach the team needs a backup.", "Keep your teammate’s secret for now.")),
        S("A younger player wants the spot and needs an answer today. Your teammate is undecided.",
          ["kid", "you"], "say", ["🙋", "⏰"], "worried"),
        M("Do you encourage your teammate to decide today, or tell the younger player to wait?",
          cards=("Encourage your teammate to decide today.", "Tell the younger player to wait.")),
    ], close=WWYD),

    dict(id="19_the_lost_sketchbook", title="The Lost Sketchbook", beats=[
        S("A sketchbook is left at the library. No name. Your friend wants to look inside for clues.",
          ["friend", "you"], "say", ["📓", "🔍"], "worried"),
        M("Do you look inside to find the owner, or hand it to the library desk unopened?",
          cards=("Look inside to find the owner.", "Hand it to the library desk unopened.")),
        S("The owner is found. Your friend wants to praise the art online. The artist hasn’t agreed.",
          ["friend", "you"], "say", ["🎨", "📱", "👍"], "worried"),
        M("Do you ask the artist before posting, or post praise without showing the art?",
          cards=("Ask the artist before posting.", "Post praise without showing the art.")),
    ], close=WWYD),

    dict(id="20_the_group_chat_photo", title="The Group Chat (photo)", beats=[
        S("An embarrassing photo of your friend is posted. Everyone laughs. Your friend hasn’t seen it.",
          ["friend2", "stranger", "you"], "laugh", ["📸", "😳"], "worried"),
        M("Do you ask your friend to remove it, or stay quiet to avoid a fight?",
          cards=("Ask your friend to remove it.", "Stay quiet to avoid a fight.")),
        S("Your friend asks why everyone’s laughing. The poster asks you not to tell.",
          ["friend", "you"], "say", ["😂", "❓"], "worried"),
        M("Do you tell your friend about the photo, or give the person who posted it time to explain?",
          cards=("Tell your friend about the photo.", "Give the person who posted it time to explain.")),
    ], close=WWYD),

    dict(id="21_the_birthday_plan", title="The Birthday Plan", beats=[
        S("A surprise party is planned. The birthday friend says they hate surprises and want a quiet day.",
          ["friend", "you"], "say", ["🎉", "🙅", "🛋️"], "worried"),
        M("Do you tell the group to change the plan, or keep the surprise they worked hard on?",
          cards=("Tell the group to change the plan.", "Keep the surprise they worked hard on.")),
        S("One friend can’t afford their share of the gift. Everyone else wants equal contributions.",
          ["friend2", "you"], "tell", ["🎁", "💸"], "sad"),
        M("Do you cover their share without telling anyone, or ask the group to choose a cheaper gift?",
          cards=("Cover their share without telling anyone.", "Ask the group to choose a cheaper gift.")),
    ], close=WWYD),

    # ---------------- Earlier approved originals
    dict(id="22_the_lie", title="The Lie", beats=[
        S("Your close friend lies in front of you to avoid getting in trouble.", ["friend", "you"], "say", ["🤥"], "shock"),
        S("Everyone looks at you and asks if what they said is true.", ["elder", "you", "friend2"], "react",
          ["👀", "❓"], "worried", others="worried"),
        M("Do you back them up… or tell the truth?"),
    ], close=WWYD),

    dict(id="23_the_promotion", title="The Promotion", beats=[
        S("You and a coworker are both up for a promotion.", ["coworker", "you"], "react", ["🏆", "📈"], "happy",
          others="happy"),
        S("You overhear personal information that could hurt their chances.", ["you"], "think", ["👂", "🤫"]),
        M("Stay quiet? It’s fair. Tell your boss? You likely win."),
    ], close=WWYD),

    dict(id="24_another_chance", title="Another Chance", beats=[
        S("Someone who hurt you in the past genuinely apologizes…", ["ex", "you"], "say", ["🙏", "💔"], "sad"),
        S("They ask for another chance and say they’ve changed.", ["ex", "you"], "say", ["🌱", "🔁"], "worried"),
        M("Do you forgive them… or protect your peace?"),
    ], close=WWYD),

    dict(id="25_the_public_comment", title="The Public Comment", beats=[
        S("A friend says something ignorant publicly.", ["friend", "stranger", "you"], "say", ["📢", "🙊"], "shock",
          others="angry"),
        S("You know they didn’t mean harm… but people are upset.", ["you"], "think", ["😠", "😬"]),
    ], close=WWYD),

    dict(id="26_the_honest_review", title="The Honest Review", beats=[
        S("A friend launches a new business and asks for your review.", ["friend", "you"], "say", ["🏪", "⭐"], "happy"),
        S("You tried the product. It didn’t really impress you.", ["you"], "see", ["📦", "😐"], "worried"),
        M("Do you post an honest review… or protect their business and stay positive?"),
    ], close=WWYD),

    # ---------------- Earlier source and review inventory
    dict(id="27_the_secret", title="The Secret", beats=[
        S("Your best friend is in love.", ["friend", "you"], "say", ["😍", "💕"], "happy"),
        S("You see their partner kiss someone else. Your friend has no idea.", ["partner", "stranger", "you"], "say",
          ["💋"], "shock"),
    ], close="Do you tell your friend or stay out of it?"),

    dict(id="28_the_gift", title="The Gift", beats=[
        S("Someone gives you a gift you don't like.", ["friend2", "you"], "give", ["🎁", "🧦"], "worried"),
        M("Do you pretend you love it... or are you honest about how you feel?"),
    ], close=WWYD),

    dict(id="29_the_unasked_advice", title="The Unasked Advice", beats=[
        S("Your friend is about to make a huge mistake.", ["friend", "you"], "say", ["⚠️", "🕳️"], "worried"),
        M("But they didn't ask for advice. Do you warn them... or stay out of it?"),
    ], close=WWYD),

    dict(id="30_the_one_left_out", title="The One Left Out", beats=[
        S("Someone is being left out in a group.", ["friend", "friend2", "you"], "laugh", ["👥", "😔"], "sad"),
        S("Including them might make it awkward.", ["you"], "think", ["🙋", "😬"]),
        M("Do you include them anyway... or keep the vibe?"),
    ], close=WWYD),

    dict(id="31_the_rumor", title="The Rumor", beats=[
        S("Someone spreads a rumor about you.", ["friend2", "stranger", "you"], "laugh", ["🗣️", "👂"], "angry"),
        S("You find out who it was.", ["you"], "think", ["🕵️", "😠"]),
        M("Do you expose them... or let karma handle it?"),
    ], close=WWYD),

    dict(id="32_reputation_or_feelings", title="Reputation or Feelings", beats=[
        S("You can either save your reputation... or save someone else's feelings.", ["you"], "think", ["🏅", "💗"]),
        M("Which matters more?"),
    ], close=WWYD),

    dict(id="33_the_dropped_money", title="The Dropped Money", beats=[
        S("You see someone drop money... and walk away.", ["stranger", "you"], "react", ["💵", "🚶"], "shock"),
        M("Do you run after them... or keep it?"),
    ], close=WWYD),

    dict(id="34_who_do_you_help", title="Who Do You Help?", beats=[
        S("You can help one person today. Someone who always helped you... or someone who never had anyone.",
          ["friend", "you", "stranger"], "react", ["🤝", "🫂"], "worried"),
        M("Who do you help?"),
    ], close=WWYD),

    dict(id="35_honesty_or_kindness", title="Honesty or Kindness", beats=[
        M("You can only pick one."),
        S("Always be honest for the rest of your life... or always be kind for the rest of your life.",
          ["you"], "think", ["🗣️", "💗"]),
        M("Which do you choose?"),
    ], close=WWYD),

    dict(id="36_the_old_online_post", title="The Old Online Post", beats=[
        S("A person online said something rude years ago. Now they say they’ve changed.", ["you"], "see",
          ["📱", "💬", "🔁"], "worried"),
        S("People want them canceled.", ["friend", "friend2", "you"], "say", ["🚫", "📢"], "worried", others="angry"),
        M("Do you forgive them or hold them accountable forever?"),
    ], close=WWYD),

    dict(id="37_too_much_change", title="Too Much Change", beats=[
        S("A cashier gives you too much change back by mistake.", ["stranger", "you"], "give", ["💰", "🪙"], "worried"),
        M("It’s not a huge amount... but it’s wrong."),
    ], close=WWYD),

    dict(id="38_the_cheating_friend", title="The Cheating Friend", beats=[
        S("Your best friend cheats on a test.", ["friend", "you"], "tell", ["📝", "👀"], "shock"),
        M("Report them... or stay silent?"),
    ], close=WWYD),

    dict(id="39_the_group_chat", title="The Group Chat", beats=[
        S("You see someone talking crazy about your friend in a group chat.", ["you"], "see", ["📱", "🗯️", "😡"], "angry"),
        M("Do you screenshot it and send it to them... or stay quiet to avoid drama?"),
    ], close=WWYD),

    dict(id="40_the_found_wallet", title="The Found Wallet", beats=[
        S("You find a wallet with $500 cash and an ID inside. Nobody saw you pick it up.", ["you"], "see",
          ["👛", "💵", "🪪"], "shock"),
        M("Do you return it or keep it?"),
    ], close=WWYD),

    dict(id="41_every_unfiltered_thought", title="Every Unfiltered Thought", beats=[
        S("Your partner is forced to tell you every thought they have about you. No filter.", ["partner", "you"], "say",
          ["💭", "🗣️"], "shock"),
        M("Would that honesty save the relationship or destroy it?"),
    ], close=WWYD),

    dict(id="42_micro_cheating", title="Micro-Cheating?", beats=[
        M("Micro-cheating is when little online interactions feel like crossing a line to your partner."),
        S("If you like comments from an ex often and reply with hearts but claim it is harmless…", ["you"], "see",
          ["📱", "❤️", "💬"], "smug"),
        M("Does that count as cheating, or is it okay?"),
    ], close=WWYD),

    dict(id="43_the_faithful_clone", title="The Faithful Clone", beats=[
        S("Imagine an exact clone of your partner: same memories, same personality, same love for you.",
          ["partner", "partner", "you"], "react", ["🧬", "👯"], "shock"),
        S("But the original cheated and the clone never did.", ["partner", "partner", "you"], "react", ["💔", "😇"],
          "worried"),
        M("Are you going to be mad at the clone, or take this as a fresh start?"),
    ], close=WWYD),

    dict(id="44_honesty_or_confidence", title="Honesty or Confidence", beats=[
        S("Your friend asks: am I really good at this?", ["friend", "you"], "say", ["🎤", "❓"], "worried"),
        M("Telling the truth might crush them. Lying might keep them confident, but mislead them."),
    ], close=WWYD),

    dict(id="45_your_dream_or_your_family", title="Your Dream or Your Family", beats=[
        S("You get your dream opportunity in another city or country.", ["you"], "see", ["✉️", "✈️", "🌆"], "happy"),
        S("But leaving means your family will struggle emotionally without you.", ["elder", "kid", "you"], "react",
          ["👨‍👩‍👧", "😢"], "sad", others="sad"),
        M("Do you chase your dream, or stay for them?"),
    ], close=WWYD),

    dict(id="46_returned_damaged", title="Returned Damaged", beats=[
        S("Someone borrowed your favorite thing and returned it damaged.", ["friend", "you"], "give", ["🎧", "💥"], "shock"),
        S("They act like it is not a big deal.", ["friend", "you"], "say", ["🤷"], "angry", spk_smile=0.7),
        M("Do you confront them, or let it go to keep the peace?"),
    ], close=WWYD),

    dict(id="47_the_group_project", title="The Group Project", beats=[
        S("A group project goes wrong, and everyone might fail.", ["friend", "teammate", "you"], "react", ["📉", "❌"],
          "worried", others="worried"),
        S("You know exactly who didn't do their part.", ["you"], "think", ["🫵", "🤐"]),
    ], close=WWYD),

    dict(id="48_one_friend_or_five_strangers", title="One Friend or Five Strangers", beats=[
        S("A building is on fire, and you can only save one: your best friend, or five strangers.",
          ["friend", "you", "stranger"], "react", ["🔥", "🏢"], "shock", others="worried"),
        M("Which do you choose?"),
    ], close=WWYD),

    dict(id="49_the_trolley_lever", title="The Trolley Lever", beats=[
        S("A trolley is hurtling down the track toward an elderly lady. If you pull the lever, it will switch to a side track where a baby lies.",
          ["you"], "think", ["🚋", "👵", "👶"]),
        M("You have the control. Would you switch the lever?"),
    ], close=WWYD),

    dict(id="50_one_place_left", title="One Place Left", beats=[
        S("A boat is sinking, and there's only room for one more person.", ["you"], "react", ["🚤", "🌊"], "shock"),
        S("You can save either a pregnant woman or a little kid.", ["you"], "think", ["🤰", "🧒"]),
        M("Who do you pull in?"),
    ], close=WWYD),

    dict(id="51_the_urgent_call", title="The Urgent Call", beats=[
        S("You get a call that sounds exactly like your loved one. Same voice, same mannerisms. They say they urgently need $3,000.",
          ["you"], "see", ["📱", "📞", "💵"], "shock"),
        S("But something in your gut says it could be AI.", ["you"], "think", ["🤖", "❓"]),
        M("Do you send help immediately and risk being scammed… or hold off to verify and risk losing precious time?"),
    ], close=WWYD),

    dict(id="52_the_broken_lever", title="The Broken Lever", beats=[
        S("A train is speeding toward five people, but the lever that could divert it is broken.", ["you"], "think",
          ["🚆", "🔧"]),
        S("You can stop the train by pushing one big stranger onto the tracks.", ["stranger", "you"], "react",
          ["🚆", "🛤️"], "worried"),
        M("Do you push them?"),
    ], close=WWYD),
]

# Setting for each story scene, in order (keeps every scene in a place that fits the dilemma)
SETS = {
    "01_your_brother": ["home"],
    "02_the_school_garden": ["yard", "yard"],
    "03_the_phone_swap": ["dinner", "dinner", "dinner"],
    "04_the_ex_plus_one": ["home", "home", "home"],
    "05_the_group_chat_relationship": ["gamenight", "gamenight", "home"],
    "06_the_missing_deposit": ["moving", "moving", "moving"],
    "07_the_wallet": ["street", "home_night"],
    "08_the_resume": ["home"],
    "09_the_message": ["home_night"],
    "10_the_cover_story": ["cafe"],
    "11_the_neighborhood_game": ["park", "park"],
    "12_the_broken_gift": ["home", "dinner"],
    "13_the_team_project": ["classroom", "classroom"],
    "14_the_private_message": ["cafe", "park"],
    "15_the_lost_wallet": ["street", "street"],
    "16_the_community_meal": ["hall", "store"],
    "17_the_night_reading_room": ["library", "library"],
    "18_the_team_secret": ["field", "field"],
    "19_the_lost_sketchbook": ["library", "park"],
    "20_the_group_chat_photo": ["classroom", "yard"],
    "21_the_birthday_plan": ["party", "party"],
    "22_the_lie": ["classroom", "classroom"],
    "23_the_promotion": ["office", "office"],
    "24_another_chance": ["park", "park"],
    "25_the_public_comment": ["street", "street"],
    "26_the_honest_review": ["cafe", "home"],
    "27_the_secret": ["park", "cafe"],
    "28_the_gift": ["party"],
    "29_the_unasked_advice": ["cafe"],
    "30_the_one_left_out": ["classroom", "classroom"],
    "31_the_rumor": ["yard", "yard"],
    "32_reputation_or_feelings": ["home_night"],
    "33_the_dropped_money": ["street"],
    "34_who_do_you_help": ["street"],
    "35_honesty_or_kindness": ["park"],
    "36_the_old_online_post": ["home_night", "street"],
    "37_too_much_change": ["store"],
    "38_the_cheating_friend": ["classroom"],
    "39_the_group_chat": ["home_night"],
    "40_the_found_wallet": ["park"],
    "41_every_unfiltered_thought": ["home"],
    "42_micro_cheating": ["home_night"],
    "43_the_faithful_clone": ["home", "home"],
    "44_honesty_or_confidence": ["home"],
    "45_your_dream_or_your_family": ["home", "home"],
    "46_returned_damaged": ["home", "home"],
    "47_the_group_project": ["classroom", "classroom"],
    "48_one_friend_or_five_strangers": ["fire"],
    "49_the_trolley_lever": ["tracks"],
    "50_one_place_left": ["sea", "sea"],
    "51_the_urgent_call": ["home_night", "home_night"],
    "52_the_broken_lever": ["tracks", "tracks"],
}
for _ad in ADS:
    _scenes = [b for b in _ad["beats"] if b[0] == "scene"]
    assert len(_scenes) == len(SETS[_ad["id"]]), _ad["id"]
    for _b, _s in zip(_scenes, SETS[_ad["id"]]):
        _b[2].setdefault("set", _s)

# Fixes from the AI review pass (scene index = order among scene beats)
REVIEW_FIXES = {
    '03_the_phone_swap': [[1, "chars", ["partner", "you"]], [1, "others", "neutral"]],
    '05_the_group_chat_relationship': [[0, "chars", ["friend", "partner", "you"]], [0, "icons", ["🎲", "🗣️", "💢"]]],
    '07_the_wallet': [[1, "react", "worried"]],
    '08_the_resume': [[0, "icons", ["📄", "🤥", "💼", "🏠"]]],
    '11_the_neighborhood_game': [[1, "chars", ["stranger", "you", "kid"]], [1, "others", "worried"]],
    '12_the_broken_gift': [[1, "icons", ["🤨", "👉", "🍽️"]]],
    '13_the_team_project': [[1, "chars", ["friend2", "you"]]],
    '15_the_lost_wallet': [[0, "icons", ["👛", "💵", "🪪"]]],
    '16_the_community_meal': [[0, "chars", ["friend2", "you", "friend"]]],
    '17_the_night_reading_room': [[0, "chars", ["kid", "you", "coworker"]]],
    '18_the_team_secret': [[1, "chars", ["kid", "you", "teammate"]]],
    '20_the_group_chat_photo': [[0, "icons", ["📱", "📸", "😳"]]],
    '21_the_birthday_plan': [[0, "set", "home"], [1, "set", "home"]],
    '22_the_lie': [[1, "chars", ["elder", "you", "friend"]]],
    '27_the_secret': [[1, "act", "react"], [1, "icons", ["💋", "🤫"]], [1, "others", "happy"]],
    '29_the_unasked_advice': [[0, "icons", ["🤩", "🕳️"]], [0, "spk_smile", 0.8]],
    '30_the_one_left_out': [[0, "chars", ["friend", "stranger", "you"]], [0, "act", "react"], [0, "icons", ["👥", "🚫", "🧍"]], [0, "react", "worried"], [1, "react", "worried"]],
    '31_the_rumor': [[1, "chars", ["friend2", "you"]], [1, "act", "react"], [1, "icons", ["🔍", "🗣️"]], [1, "react", "angry"], [1, "others", "worried"]],
    '32_reputation_or_feelings': [[0, "react", "worried"]],
    '35_honesty_or_kindness': [[0, "react", "think"]],
    '36_the_old_online_post': [[0, "icons", ["📱", "🤬", "😇"]]],
    '38_the_cheating_friend': [[0, "act", "react"], [0, "icons", ["👀", "📝", "🤫"]], [0, "others", "smug"]],
    '42_micro_cheating': [[0, "chars", ["partner", "you"]], [0, "others", "worried"], [0, "icons", ["📱", "💔", "❤️", "💬"]]],
    '47_the_group_project': [[1, "chars", ["friend", "teammate", "you"]], [1, "icons", ["👉", "😴", "🤐"]], [1, "react", "think"], [1, "others", "neutral"]],
    '48_one_friend_or_five_strangers': [[0, "icons", ["🫂", "⚖️", "5️⃣", "👥"]]],
    '49_the_trolley_lever': [[0, "icons", ["🚋", "👵", "🔀", "👶"]]],
    '51_the_urgent_call': [[0, "icons", ["📱", "📞", "❤️", "💵"]]],
    '52_the_broken_lever': [[0, "icons", ["🚆", "5️⃣", "👥", "❌"]], [1, "icons", ["✋", "🛑", "🚆"]], [1, "others", "neutral"]],
}
for _ad in ADS:
    _scenes = [b for b in _ad["beats"] if b[0] == "scene"]
    for _i, _field, _value in REVIEW_FIXES.get(_ad["id"], []):
        _scenes[_i][2][_field] = _value

REVIEW_FIXES_2 = {
    "42_micro_cheating": [(0, "icons", ["📱", "👍", "💬", "❤️"])],
    "47_the_group_project": [(1, "chars", ["teammate", "you"])],
    "49_the_trolley_lever": [(0, "icons", ["🚋", "👵", "👶"])],
    "52_the_broken_lever": [(0, "icons", ["🚆", "👥", "❌"])],
    "20_the_group_chat_photo": [(1, "chars", ["friend", "you", "friend2"]), (1, "icons", ["😂", "❓", "🤫"]), (1, "others", "worried")],
}
for _ad in ADS:
    _scenes = [b for b in _ad["beats"] if b[0] == "scene"]
    for _i, _field, _value in REVIEW_FIXES_2.get(_ad["id"], []):
        _scenes[_i][2][_field] = _value

# Final-video QA fixes: stage the key moment so it is visible on screen
_W = [(140, -895), (210, -725), (70, -725), (210, -555), (70, -895)]
REVIEW_FIXES_3 = {
    "27_the_secret": [
        (0, "chars", ["friend", "partner", "you"]), (0, "xs", [-250, -110, 200]), (0, "exprs", {1: "happy"}),
        (1, "chars", ["partner", "stranger", "you"]), (1, "xs", [-235, -95, 210]), (1, "act", "witness"),
        (1, "icons", ["💋"]), (1, "react", "shock"), (1, "at", 0.45)],
    "30_the_one_left_out": [
        (0, "chars", ["friend", "you", "stranger"]), (0, "xs", [-265, -120, 245]), (0, "act", "say"),
        (0, "icons", ["😂", "💬"]), (0, "spk_smile", 0.8), (0, "exprs", {2: "sad"}), (0, "face", {2: 1.0})],
    "33_the_dropped_money": [
        (0, "act", "react"), (0, "icons", []), (0, "walk", {0: (-560, 0.2, 0.65)}),
        (0, "ground", [("💵", -150, 0.15)]), (0, "react", "shock"), (0, "at", 0.6)],
    "37_too_much_change": [(0, "icons", ["🪙", "🪙", "➕"])],
    "48_one_friend_or_five_strangers": [
        (0, "chars", ["you"]), (0, "act", "react"), (0, "icons", []), (0, "no_truck", True),
        (0, "decor", [("🧑🏾‍🦱", -210, -725, 95), ("❤️", -150, -790, 40)] + [("🙋", x, y, 80) for x, y in _W]),
        (0, "react", "shock"), (0, "at", 0.35)],
    "49_the_trolley_lever": [(0, "cam", (40, -470, 1150)), (0, "xs", [175]), (0, "side_track", True),
                             (0, "decor", [("👵", -125, -75, 80), ("👶", -235, -70, 70)])],
    "50_one_place_left": [
        (0, "set", "lifeboat"), (0, "icons", ["🌊", "1️⃣"]), (0, "cam", (0, -500, 1350)),
        (1, "set", "lifeboat"), (1, "cam", (0, -500, 1350)),
        (1, "front", [("🤰", -262, -90, 92), ("🧒", 262, -90, 84)])],
    "52_the_broken_lever": [
        (0, "cam", (40, -470, 1150)), (0, "xs", [175]), (0, "broken_lever", True), (0, "train", "🚆"),
        (0, "decor", [("🧍", x, -70, 58) for x in (-215, -170, -125, -80, -35)]),
        (1, "chars", ["you", "stranger"]), (1, "xs", [-10, 165]), (1, "scale", {1: 1.25}), (1, "cam", (60, -540, 1320)),
        (1, "decor", [("🧍", x, -70, 50) for x in (-260, -225, -190, -155, -120)]),
        (1, "broken_lever", True), (1, "train", "🚆")],
}
for _ad in ADS:
    _scenes = [b for b in _ad["beats"] if b[0] == "scene"]
    for _i, _field, _value in REVIEW_FIXES_3.get(_ad["id"], []):
        _scenes[_i][2][_field] = _value
