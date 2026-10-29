/* ===== Nội dung đề thi → HTML. Ô trả lời gắn data-q; vùng tô sáng có class "hl" và data-hid ===== */
var EXAM_CONTENT = (function () {
  var hid = 0;
  function HL(tag, cls, html) { hid++; return '<' + tag + ' class="hl ' + (cls || '') + '" data-hid="h' + hid + '">' + html + '</' + tag + '>'; }
  function G(n, w) {
    return '<span class="gapwrap" id="q' + n + '"><b class="gn">(' + n + ')</b><input class="gap' + (w ? ' gap-' + w : '') +
      '" data-q="' + n + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Câu ' + n + '"></span>';
  }
  function SEL(n, opts) {
    return '<select class="sel" data-q="' + n + '" aria-label="Câu ' + n + '"><option value="">—</option>' +
      opts.map(function (o) { return '<option value="' + o + '">' + o + '</option>'; }).join('') + '</select>';
  }
  function MC(n, stem, opts, layout) {
    var L = ['A', 'B', 'C', 'D'];
    var o = opts.map(function (t, i) {
      return '<label class="opt"><input type="radio" name="q' + n + '" value="' + L[i] + '" data-q="' + n + '"><span class="ol">' + L[i] + '.</span> <span class="ot">' + t + '</span></label>';
    }).join('');
    return '<div class="q" id="q' + n + '">' + HL('div', 'stem', '<b class="qn">' + n + '.</b> ' + stem) +
      '<div class="opts ' + (layout || 'c4') + '">' + o + '</div></div>';
  }
  function head(t) { return '<h3 class="task">' + t + '</h3>'; }
  function part(t) { return '<h2 class="part">' + t + '</h2>'; }
  function title(t) { return '<h4 class="ptitle">' + t + '</h4>'; }
  function P(t) { return HL('p', '', t); }

  var h = [];
  /* ---------- PART A ---------- */
  h.push('<section class="sec" id="partA">', part('PART A: PHONETICS <span>(2.0 points)</span>'),
    head('I. Choose the word whose underlined part is pronounced differently from that of the others.'));
  [
    [1, 'balanc<u>ed</u>', 'suffer<u>ed</u>', 'appli<u>ed</u>', 'propos<u>ed</u>'],
    [2, 'tha<u>n</u>k', 'ba<u>n</u>d', 'complai<u>n</u>', 'i<u>n</u>sert'],
    [3, 'hold<u>s</u>', 'note<u>s</u>', 'clean<u>s</u>', 'sing<u>s</u>'],
    [4, 'h<u>ea</u>d', 'pl<u>ea</u>se', 'h<u>ea</u>vy', 'm<u>ea</u>sure'],
    [5, 'sc<u>ou</u>t', 'h<u>ou</u>sehold', 'm<u>ou</u>se', 'nerv<u>ou</u>s']
  ].forEach(function (r) { h.push(MC(r[0], '', r.slice(1), 'c4 inline')); });
  h.push(head('II. Choose the word whose main stressed syllable is placed differently from that of the others.'));
  [
    [6, 'bacteria', 'examine', 'nutrient', 'infection'],
    [7, 'curious', 'honesty', 'heritage', 'mechanic'],
    [8, 'imperial', 'doctorate', 'qualify', 'privacy'],
    [9, 'inflict', 'disease', 'sensor', 'complete'],
    [10, 'vocational', 'graduation', 'historical', 'sustainable']
  ].forEach(function (r) { h.push(MC(r[0], '', r.slice(1), 'c4 inline')); });
  h.push('</section>');

  /* ---------- PART B ---------- */
  h.push('<section class="sec" id="partB">', part('PART B: LEXICO-GRAMMAR <span>(5.0 points)</span>'),
    head('I. Questions 11-20: Choose the best option A, B, C, or D to indicate the correct answer to each of the following questions.'));
  [
    [11, 'I only _______ out of the window, so I didn’t notice what the man was wearing.', ['glanced', 'peered', 'glimpsed', 'watched']],
    [12, 'I _______ hope there won’t be a repetition of these unfortunate events.', ['bitterly', 'sincerely', 'unfailingly', 'completely']],
    [13, 'Let’s _______ advantage of the good weather and go to the beach.', ['make', 'get', 'catch', 'take']],
    [14, '_______ extensively, they shared their experiences in a travel blog.', ['Traveled', 'Having traveled', 'Being traveled', 'Traveling']],
    [15, 'The report found the condition of grasslands was poor and _______ the blame on intensive agriculture and poor land management.', ['put', 'took', 'made', 'gave']],
    [16, 'Not only _______ visit Spain but they plan to stop off in Italy as well.', ['they plan to', 'are they paying', 'do they also', 'will they']],
    [17, 'Global warming has progressed _______ glaciers everywhere are shrinking.', ['too much that', 'enough to cause', 'to such an extent that', 'so great an extent that'], 'c2'],
    [18, 'Jack Anderson was caught _______ a match at the time of the fire. He was accused of _______ the fire.', ['to hold/ set', 'held/ setting', 'holding/ to set', 'holding/ setting']],
    [19, 'They’ve been living in England for a short time, and they’re still not used to _______ on the left.', ['drive', 'driving', 'be driving', 'driven']],
    [20, 'It is only recently that ballets have been based on the themes _______ American life.', ['reflecting', 'reflects', 'is reflecting', 'reflected']]
  ].forEach(function (r) { h.push(MC(r[0], r[1], r[2], r[3])); });

  h.push(head('II. Questions 21-25: Read the passage, then fill in each of the numbered spaces with the correct form of the words given in the box. There are TWO words that you do not need to use. The first one (0) has been done as an example.'),
    '<table class="box words"><tr><td><s>adequate</s></td><td>anxious</td><td>restrict</td><td>perceive</td></tr><tr><td>employ</td><td>secure</td><td>free</td><td>depend</td></tr></table>',
    title('Voices of the Poor'),
    P('Poverty is much more than a(n) (0) <b><u>inadequate</u></b> income. For the poor, the good life or well-being is multidimensional with both material and psychological dimensions. Well-being is ' + G(21) + ' of choice and action; it is peace of mind; it is safety; it is belonging to a community; it is a(n) ' + G(22) + ' livelihood and a steady source of income; it is food. The poor describe ill-being as lack of material things - food especially, but also lack of ' + G(23) + ', money, shelter and clothing - and living and working in often unhealthy, polluted and risky environments. They also defined ill-being as bad experiences and bad feelings about oneself. ' + G(24) + ' of powerlessness over one’s life and of being voiceless were not uncommon; neither were feelings of ' + G(25) + ' and fear for the future.'));

  h.push(head('III. Questions 26-30: The passage below contains 5 mistakes. Find the mistakes and write your corrections in the table. An example has been done for you.'));
  var ecLines = [
    'Black carbon is <b><u>the</u></b> light-absorbing particulate matter that contributes to climate change by',
    'converting solar radiation by heat within the atmosphere. It is considered the second most significant',
    'contributor to global warming after carbon dioxide and is classified like a short-lived climate',
    'pollutant. Black carbon remains in the atmosphere for only a few days to weeks before being remove',
    'through precipitation and dry deposition. However, during its atmospheric lifetime, it exerts a',
    'substantially stronger warming effect than carbon dioxide. For instance, one ton of black carbon is',
    'estimated to have a global warming potential equivalent to approximate 900 tons of carbon dioxide',
    'over a 100-year time horizon. Consequently, reduce black carbon emissions can help slow the rate',
    'of near-term warming driven by greenhouse gases.'
  ];
  h.push('<div class="lines"><div class="lh">Line</div>' + ecLines.map(function (l, i) {
    return '<div class="ln"><span class="lno">' + (i + 1) + '</span>' + HL('span', 'ltx' + (i === 0 ? ' first' : ''), l) + '</div>';
  }).join('') + '</div>');
  var ecRows = '';
  for (var e = 26; e <= 30; e++) {
    ecRows += '<tr id="q' + e + '"><td class="c">' + e + '.</td>' +
      '<td><select class="ecin ecl" data-q="' + e + '" data-f="l" aria-label="Dòng câu ' + e + '"><option value="">—</option>' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<option>' + n + '</option>'; }).join('') + '</select></td>' +
      '<td><input class="ecin" data-q="' + e + '" data-f="m" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Lỗi câu ' + e + '"></td>' +
      '<td><input class="ecin" data-q="' + e + '" data-f="c" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Sửa câu ' + e + '"></td></tr>';
  }
  h.push('<table class="box ec"><thead><tr><th>Questions</th><th>Line</th><th>Mistakes</th><th>Corrections</th></tr></thead><tbody>' +
    '<tr class="eg"><td class="c"><i>0. E.g.</i></td><td class="c"><i>1</i></td><td><i>the</i></td><td><i>a</i></td></tr>' + ecRows + '</tbody></table>');

  h.push(head('IV. Questions 31-35: Complete the sentences with the correct form of a verb in A, and a preposition/ particle in B. There is one extra preposition that you do not need to use.'),
    '<div class="tblwrap"><table class="box words ab"><tr><th colspan="5">A</th><th colspan="6">B</th></tr><tr><td>cope</td><td>come</td><td>cut</td><td>apply</td><td>suffer</td><td>for</td><td>down</td><td>into</td><td>from</td><td>at</td><td>with</td></tr></table></div>');
  [
    [31, 'My doctor told me that I need to ', ' on eating fried foods in order to improve my cholesterol.'],
    [32, 'Increasing numbers of children are ', ' mental health problems.'],
    [33, 'After she finished the course she ', ' jobs at a number of newspapers.'],
    [34, 'Desert plants are adapted to ', ' extreme heat.'],
    [35, 'I ', ' conflict with Tiffany when she found out that I had started that rumor about her.']
  ].forEach(function (r) { h.push(HL('p', 'sent', r[1] + G(r[0], 'm') + r[2])); });
  h.push('</section>');

  /* ---------- PART C ---------- */
  h.push('<section class="sec" id="partC">', part('PART C: READING <span>(8.0 points)</span>'),
    head('I. Questions 36-45: Complete the following passage by filling each blank with ONE suitable word.'),
    P('Mindfulness, the practice of staying fully present in the moment, has gained widespread popularity in recent years. Its benefits are numerous, ' + G(36) + ' it an appealing option for those seeking to improve their mental well-being. Research shows that mindfulness can ' + G(37) + ' stress and enhance focus, making it particularly valuable ' + G(38) + ' today’s fast-paced world. Unlike many other wellness trends, mindfulness requires ' + G(39) + ' special equipment or training, ' + G(40) + ' contributes to its accessibility. By simply setting aside a few minutes each day, individuals can develop a habit that has a profound impact ' + G(41) + ' their emotional health. What makes mindfulness especially effective is its ability to be integrated ' + G(42) + ' daily routines, such as during a commute or while eating. However, consistency is key, as the benefits are most noticeable ' + G(43) + ' practiced regularly. Critics argue that mindfulness is not a cure-all, but its supporters insist that it provides tools to navigate life’s challenges ' + G(44) + ' greater ease. As more people embrace this practice, it is likely to remain a cornerstone of modern wellness for years to ' + G(45) + '.'));

  h.push(head('II. Questions 46-52: You are going to read an article, seven paragraphs have been removed from the article. Choose from the paragraphs A-H the one which fits each gap (46-52). There is one extra paragraph which you do not need to use.'),
    title('To Buy or Not to Buy'),
    HL('p', 'lead', '<i>Buying a home that’s what everyone else is doing, right? Look before you leap, and get the real facts on home values, cost of ownership and your own financial situation before making a big commitment that truly isn’t for everyone.</i>'));
  var AH = 'ABCDEFGH'.split('');
  [
    'If you’re feeling pressure to buy a home, don’t despair; simply consider yourself a member of the hottest club in town! Home prices are spiralling ever upward, indicating a demand that’s outstripping the available supply of new and used homes and flats. Wait too long to buy a house, many people fear, and you could find yourself priced out of the market - or at least out of the neighbourhoods you like best.',
    'Despite this sudden trust, it doesn’t follow that everyone should be a homeowner. It’s a far bigger commitment than most first-time buyers ever realise. You should have a clear idea of what you’re getting into before you commit to 30 years of payments - and you shouldn’t let any of the popular myths guide your decision.',
    'After dropping more than 20% in the 1990s, Los Angeles home prices took almost 10 years to regain their peak. Anyone who lived there during that time knows people who ended up owing a bigger mortgage than their home could be sold for. Thousands of people simply walked away from houses they couldn’t sell, ruining their credit ratings in the process.',
    'When you’re a renter, it’s the landlord, not you, who is generally responsible for maintenance, repairs, and fixing the furnace that blows up in the middle of the night. What’s more, you’re at liberty to get up and move with a few weeks’ notice if you have to.',
    'Don’t forget too, that while it’s true to say that as a tenant you may have to deal with rising rents and grouchy landlords, homeowners are often stuck with rising taxes, exorbitant maintenance costs and unreasonable neighbours.',
    'Don’t misunderstand —the tax break is nice, and you do need somewhere to live. But remember that many of the real costs of owning a home aren’t deductible. The government won’t give you a break for insurance, repairs or maintenance, for example —and those costs can really add up.',
    'And don’t even think you can get out of it, because in the long run, if you fail to maintain your home properly, you’ll pay even more when it is time to sell. Many buyers won’t even bid on a property that shows significant neglect.',
    'In other words, regard homeownership as something like a marriage, while renting as more like living together. Make sure you’re truly ready to be wedded to a house before you propose leaving behind life as a renter.'
  ].forEach(function (t, i) {
    h.push(P(t));
    if (i < 7) h.push('<div class="gapbox" id="q' + (46 + i) + '"><b>' + (46 + i) + '</b>' + SEL(46 + i, AH) + '<span class="gapline"></span></div>');
  });
  h.push('<h4 class="sub">Paragraphs</h4><div class="paras">');
  [
    'The most prevailing of these maintains that your hard-earned money is better spent on a house than invested in the stock market. While owning a home can be a good financial foundation, home prices don’t always go up. Ask homeowners in any major city of the country and they’ll tell you about the money they’ve lost in the real estate recession of the past two decades.',
    'However, that’s not really the point. Before making any sort of major investment one should seek advise from numerous informed sources. Avoid the gossip and avoid making one of life’s biggest financial blunders.',
    'Another commonly held belief is that money spent on renting a house is money down the drain. In reality, you’re not really throwing money away when you send a cheque to your landlord. You’re exchanging it for a place to live. You’re also getting freedom and flexibility —things you sacrifice when you buy a home.',
    'Last but not least, the persistent rumour that insists purchasing a house entitles you to a huge tax deduction. The truth of the matter: you get a mere 27-cent deduction on every dollar you pay in mortgage interest!',
    'On the other hand, while relocating is never fun, moving house when you actually own it is an expensive, time-consuming process. Finding a buyer can take months, and selling costs will probably eat up about 10% of your home’s value, what with agent commissions and moving expenses.',
    'Realistically, most homeowners should plan to spend at least 1% of their home’s purchase price each year on upkeep — and even more if they plan to hire some kind of handyman to come in and do all the work.',
    'In the end, the best advice on the buying versus renting issue remains the time-tested version: buy a home when the timing’s right for you, when you can swing all the costs and when you plan to stay put awhile.',
    'Meanwhile, mortgage lenders are bending over backwards to give people money to buy homes. For some inexplicable reason, banks, building societies and other financial institutions are allowing people to take on more debt or get loans with worse credit, than ever before.'
  ].forEach(function (t, i) { h.push('<div class="para"><b class="pl">' + AH[i] + '</b>' + HL('div', 'ptx', '<i>' + t + '</i>') + '</div>'); });
  h.push('</div>');

  h.push(head('III. Read the following passage and do the tasks that follow.'), title('The Generational Power Balance'));
  [
    'Throughout history, the clash between the old and the young has been a defining feature of both reality and literature. Parents have power over their children… but as those juveniles approach adolescence, they begin to put pressure on their parents’ power. They test the rules; they rebel; they create their own rules. The parents are puzzled, frustrated and resentful about the shift in the balance of power. They fight back; try to exert their leadership in an attempt to maintain their power. But as they grow towards old age, they are forced to relinquish it, while the world changes into a place they cease to recognize from their youth.',
    'The friction between old and young is set to become a feature of the twenty first century, as we approach a period where the balance of power reaches virgin territory. This is not to say that relationships between the generations are expected to worsen; rather that the unprecedented demographic changes to come will have knock-on effects that we cannot yet imagine.',
    'How can we be so sure that trials lie ahead? Demographic trends are incredibly easy to predict. Decades pass between the birth of children and their growth into adulthood, while rises in life expectancy due to affluence and better medical care are gradual. Consequently, it is possible to predict accurately what proportion of the population will be economically active, and what proportion will be dependant, for a considerable time in the future. Hence, we know that as people are living longer and having fewer children – and having them later in life - population structure will skew much more towards the aged.',
    'Statistical prediction is one thing. Predicting the implications of such trends on society is another thing entirely. In the 1900s, demographers could – or at least should – have predicted that trend toward city-living as opposed to country-living was likely to continue, as indeed it did, becoming one of the most defining features of the twentieth century. The political, economic, social and environmental implications of this shift were much harder to predict, however.',
    'Many economically developed countries already fear that by 2025, there will be too few young tax-payers in the working population to support those in old age. This is the generation that requires pensions, medical care, local services and other benefits. Governments are already putting in steps, such as compulsory work pensions and increases in the retirement age in an attempt to mitigate the problem. How effective these measures prove to be remains to be seen. Moreover, this isn’t just a predicament for richer countries. All less economically developed countries outside the AIDS stricken regions of Sub-Saharan African are experiencing the same demographic trends, and, unless their economies develop extremely quickly, their populations will suffer much more.',
    'Economically, therefore, adults will be at the mercy of the elderly. Governments will be obliged to put money and efforts into the provision for the elderly and working adults will have to forego their share. But perhaps such a conclusion is too glib. The scenario could pan out differently. After all, rising elderly populations also bring opportunities for the young, such as employment in products and services geared towards the older generation. Moreover, the shift comes at a time when seniority is beginning to count for less in the workplace than in the past. Youthful traits, such as innovation, creativity and familiarity with new technology are being recognized more and more. Perhaps power will not shift towards the elderly as much as demographic data suggests.',
    'Add another twist, and we realize that the older generation are not the old-fashioned bedridden fuddy-duddies that they perhaps were perceived to be in the past. The over-seventies look younger and are fitter than ever. Moreover, their tastes are less divergent from those of younger generations than they used to be. They listen to rock music, study at university, embrace new hobbies, travel and socialize. The lines between youth and age, culturally at least, have blurred.',
    'This may mean that a standard retirement age may become a thing of the past, as vigorous people in their seventies and eighties choose to carry on working. Such a trend would greatly ease the tax burden on the younger generations, as well as giving the older generation more choice. However, it comes as a two edged coin, as young, inexperienced workers would be forced to compete for jobs with the seasoned workers, while those in employment may never get the promotion they desire if the old guy at the top refuses to quit.',
    'Of course, the predictions envisaged in this scenario will only come to pass if the world develops in a relatively benign way. In the twentieth century population shifts were irrevocably altered by world war and economic depression, and similar events could afflict coming generations too. Until we know for sure, we can rest easy in the knowledge that the problems which arise now are the problems of success – problems that arise through economic growth, better medication, reduced inequality and by maintaining peace.'
  ].forEach(function (t) { h.push(P(t)); });
  h.push(head('Questions 53-58: Do the following statements agree with information given in the reading passage? Choose:'),
    '<table class="tfng-legend"><tr><td><b>TRUE</b></td><td><i>if the statement agrees with the information</i></td></tr><tr><td><b>FALSE</b></td><td><i>if the statement contradicts the information</i></td></tr><tr><td><b>NOT GIVEN</b></td><td><i>if there is no information on this</i></td></tr></table>');
  [
    'The population patterns predicted for the 21st century have never happened before.',
    'Predictions about the size of the human population can be made quite successfully.',
    'In 1900 it was difficult to see that many people would move to urban areas.',
    'Many rich countries are concerned about a significant imbalance in old and young people by 2025.',
    'The consequences of an imbalance between the old and the young would be worse in developed countries than in developing countries.',
    'In most developed countries today the elderly are respected less than in the past.'
  ].forEach(function (t, i) {
    var n = 53 + i;
    h.push('<div class="q tf" id="q' + n + '">' + HL('div', 'stem', '<b class="qn">' + n + '.</b> ' + t) + '<div class="opts tfo">' +
      ['TRUE', 'FALSE', 'NOT GIVEN'].map(function (v) { return '<label class="opt pill"><input type="radio" name="q' + n + '" value="' + v + '" data-q="' + n + '"><span>' + v + '</span></label>'; }).join('') + '</div></div>');
  });
  h.push(head('Questions 59-61: Complete the sentences below. Use ONE WORD ONLY from the reading passage for each answer.'),
    HL('p', 'sent', '- In future, working age adults will probably have to ' + G(59) + ' their allocation of government funds, as they are used to provide for the elderly.'),
    HL('p', 'sent', '- Nowadays, in the workplace hierarchy, less status is given to people with ' + G(60) + '.'),
    HL('p', 'sent', '- The difference between the definition of an old person and a young one is more ' + G(61) + ' than in the past.'),
    head('Questions 62-65: Complete the summary with NO MORE THAN TWO words from reading passage for each answer.'),
    P('In future, governments may abolish the fixed ' + G(62, 'l') + ' meaning that fitter elderly could help to contribute towards relieving the ' + G(63, 'l') + ' on the working population. However, there are negative implications of this, as experienced workers may be considered more employable, and there would be fewer opportunities for ' + G(64, 'l') + ' among younger workers. However, it is worth remembering that all these difficulties come as a result of ' + G(65, 'l') + '.'));

  h.push(head('IV. You are going to read some information about theme parks. For questions 66-75, choose from the theme parks (A-E). The theme parks may be chosen more than once.'),
    '<p class="sub"><b><i>Which of the theme parks</i></b></p><div class="match">');
  [
    'charges the same price for adults and children?', 'is particularly suitable for young children?', 'provides an interesting way in?',
    'is just as attractive without any rides?', 'uses films for its themes?', 'seems most appropriate for adults?', 'is based on tales and stories?',
    'charges separately for each ride?', 'has the sharpest water drop?', 'offers the greatest variety or different locations for its rides?'
  ].forEach(function (t, i) {
    var n = 66 + i;
    h.push('<div class="mrow" id="q' + n + '"><b class="qn">' + n + '.</b>' + SEL(n, ['A', 'B', 'C', 'D', 'E']) + HL('span', 'mt', t) + '</div>');
  });
  h.push('</div>', title('The Pick of the World’s Theme Parks'));
  [
    ['A', 'Universal Studios – Hollywood', 'Seen the movie? Now try the ride. Jurassic Park opened in June 1996 at a cost of $110 million. Described as “the most technically advanced interactive themed ride in entertainment history”, Jurassic Park has five-storey-tall monsters, miracles of modern bio-engineering, which come to within inches of your eyebrows. You cruise in a boat through a tropical forest, ending up diving into a pitch-dark lagoon; it is the fastest, steepest water drop in amusement park history. A lifetime of primeval terror packed into five and a half minutes. Among the other “star” attractions is WaterWorld, based on the movie and the nearest you can get to giant fireballs, exploding seaplanes and other disasters. There are also other favourites such as King Kong, Jaws, ET and Back to the Future, a journey from the Ice Age to 2015. More for grown-ups, perhaps, than children.', 'Entry details: US$69 for adults, US$59 for children.'],
    ['B', 'Sentosa – Singapore', 'For families stopping over in Singapore on the way to Australia, Sentosa is the perfect place. Two of the newest attractions are Volcano Land, offering a journey to the center of the Earth with half-hourly volcanic explosions, bursts of hot air and trembling floors, and Wonder Golf, full of waterfalls and other obstacles. Sentosa also has the largest aquarium in south-east Asia, a Fantasy Island water park with 32 rides, and several Chinese heritage performances from traditional wedding ceremonies to firewalking. There is also a butterfly park and insect kingdom. Part of the pleasure of Sentosa is getting there, on foot or by bus across a raised causeway, by the four-minute ferry ride or, most excitingly, by cable car.', 'Entry details: Everything is individually priced from S$2-S$25 for adults, roughly half for children, in addition to the S$2 entry fee.'],
    ['C', 'Legoland – Denmark', 'Legoland falls into two camps. One is Miniland, where places such as Amsterdam, Copenhagen harbour and an English village stand as high a youngster’s kneecap, each packed with detail and moving parts. There are also larger Lego figures all around the park, including Mount Rushmore, the Taj Mahal and Big Chief Sitting Bull, made of 1.5 million Lego bits. The other aspect of Legoland, the rides, are not spectacular but just right for little children. There is a sky railway, a mini driving school, helicopter rides and a boat ride through dark tunnels.', 'Entry details: Adults €13, children E10.'],
    ['D', 'Port Aventura – Spain', 'This theme park on the coast is situated near Salou on the Costa Dorada. Visitors can travel through five exotic lands: rural Spain, Polynesia, China, Mexico and the Wild West. The journeys are made by steam train, canoe, Chinese junk or on foot. People who feel brave can try the Dragon Khan rollercoaster which turns you upside down eight times. But the biggest demand is for a ride called the Tu Tu Ki Splash, a watery drop in an open-topped bus straight into a Polynesian lake.', 'Entry details: Adults €44, children €35.'],
    ['E', 'Efteling – Holland', 'Once upon a time, over 60 years ago, a Dutch artist started to build a magical land, bringing his own drawings to life. His Fairy Tale Forest is still at the heart of this timeless park of traditional tales and legends set in large woodlands. Efteling is visited by 2.5 million people each year and is an everything-to-all-ages sort of place. It is best known for its so-called dark rides, like Fata Morgana, a boat ride to a forbidden city through swamps and jungles. Even if you took the theme park out of Efteling, you would still be left with a lovely park where visitors are encouraged to bring a picnic.', 'Entry details: Adults and children both pay €30 (under-4s free).']
  ].forEach(function (p) {
    h.push('<div class="park"><div class="ph"><b class="pl">' + p[0] + '</b>' + p[1] + '</div>' + P(p[2]) + HL('p', 'entry', p[3]) + '</div>');
  });
  h.push('</section>');

  /* ---------- PART D ---------- */
  h.push('<section class="sec" id="partD">', part('PART D: WRITING <span>(5.0 points)</span>'),
    head('I. Questions 76-80: Choose the letter A, B, C, or D to indicate the best arrangement of utterances or sentences to make a meaningful exchange or text in each of the following questions.'));
  function ARR(n, lines, opts, layout) {
    return '<div class="q" id="q' + n + '"><b class="qn">' + n + '.</b>' + HL('div', 'arr', lines.map(function (l) { return '<div>' + l + '</div>'; }).join('')) +
      '<div class="opts ' + (layout || 'c4') + '">' + opts.map(function (t, i) {
        var L = 'ABCD'[i];
        return '<label class="opt"><input type="radio" name="q' + n + '" value="' + L + '" data-q="' + n + '"><span class="ol">' + L + '.</span> <span class="ot">' + t + '</span></label>';
      }).join('') + '</div></div>';
  }
  h.push(ARR(76, [
    'a. Also, young people often prefer modern technology and new ideas, which sometimes makes their parents feel uncomfortable.',
    'b. However, better communication and mutual respect can help bridge the gap between generations.',
    'c. The generation gap is a common issue in many families today.',
    'd. As a result, misunderstandings and arguments may happen more frequently.',
    'e. For example, parents may value traditional beliefs, while teenagers tend to express their opinions more freely.'
  ], ['c – e – a – d – b', 'c – a – e – d – b', 'a – c – e – d – b', 'c – e – d – a – b']));
  h.push(ARR(77, [
    'a. <b>Professor</b>: That sounds like a practical solution. Besides financial support, how can young people contribute to preserving our heritage?',
    'b. <b>Student</b>: Good morning, Professor. I believe preserving our heritage is essential for maintaining our national identity.',
    'c. <b>Professor</b>: I completely agree with you. What practical measures do you think we should take to protect historical sites?',
    'd. <b>Student</b>: They can volunteer in conservation projects and organize online campaigns to raise public awareness.',
    'e. <b>Professor</b>: Excellent. With government support and active youth participation, we can protect our cultural values for future generations.',
    'f. <b>Student</b>: In my opinion, the government should invest more money in restoring old monuments and maintaining heritage sites.'
  ], ['b – a – c – f – d – e', 'c – b – f – a – d – e', 'b – c – a – f – d – e', 'b – c – f – a – d – e'], 'c2'));
  h.push(ARR(78, [
    'a. <b>Consultant</b>: That depends on his interests and strengths. Has he considered vocational training as well as university?',
    'b. <b>Parent</b>: Thank you. I will discuss these options with him so he can make an informed decision about his future.',
    'c. <b>Parent</b>: Good morning. My son has just finished high school, and we are unsure about the best education option for him.',
    'd. <b>Consultant</b>: University provides academic knowledge, while vocational courses focus more on practical skills and quicker access to the job market.',
    'e. <b>Parent</b>: He enjoys technology, but he is not very interested in theoretical subjects.',
    'f. <b>Consultant</b>: In that case, a vocational program in information technology might suit him better.',
    'g. <b>Parent</b>: That sounds reasonable. Could you explain the differences between these two paths?'
  ], ['c – a – e – g – d – f – b', 'c – a – g – d – e – f – b', 'c – g – a – d – e – f – b', 'a – c – e – g – d – f – b'], 'c2'));
  h.push(ARR(79, [
    'a. Regular physical activity, for instance, strengthens the cardiovascular system and reduces the likelihood of chronic illnesses.',
    'b. These habits not only prevent disease but also enhance overall quality of life in the long term.',
    'c. Adequate sleep and effective stress management further support the body’s ability to recover and function efficiently.',
    'd. A long and healthy life depends largely on the daily habits individuals adopt.',
    'e. In addition to exercise, a balanced diet plays a crucial role in maintaining physical and mental well-being.'
  ], ['d – a – e – c – b', 'd – e – a – c – b', 'a – d – e – c – b', 'd – a – c – e – b']));
  h.push(ARR(80, [
    '<i>Dear Valued Community Member,</i>',
    'a. The device learns patterns from daily use, which allows it to suggest faster routes.',
    'b. I’m excited to announce our new navigation watch for cyclists.',
    'c. It provides turn-by-turn guidance through gentle vibrations on the wrist.',
    'd. Early testers report that they feel safer because they can keep their eyes on the road.',
    'e. Please sign up online if you’d like to join the second testing group next month.',
    '<i>Sincerely,</i>', '<i>Cycling Innovations Team</i>'
  ], ['a – b – c – d – e', 'b – a – e – d – c', 'b – c – d – a – e', 'b – c – a – d – e']));

  h.push(head('II. Questions 81-90: Read the following detective’s preliminary report concerning a robbery at a museum. Use the information in it to complete the numbered gaps in the press release. The words which you need DO NOT OCCUR in the detective’s report. Use NO MORE THAN TWO WORDS for each gap.'),
    '<p class="sub"><b><i>The exercise begins with an example (0).</i></b></p>',
    '<div class="doc"><div class="doch">The detective’s preliminary report</div>' + P('The museum guard went off duty at 9.30 and the replacement was delayed and did not arrive until 10 pm. When I was called to the scene of the crime there weren’t any fingerprints but a wrench had been left behind by the robbers. Only the two most valuable paintings had been taken so I assume the robbers knew about art. At first I suspected James Smith but I was later told he was in jail at the time of the crime. Customers in the café opposite the museum possibly witnessed something and I hope they come forward as soon as possible. Witnesses’ identities will be kept confidential.') + '</div>',
    '<div class="doc press"><div class="doch">The press release</div>' + P('The museum robbery (0) <b><u>might/could</u></b> have taken place at around 9.45 pm. The robbers ' + G(81) + ' worn gloves as no fingerprints ' + G(82) + ' at the scene of the crime. Evidence ' + G(83) + ' that they had forced entry into the museum with a tool. The robbers were obviously ' + G(84) + ' about art because only paintings of exceptionally high ' + G(85) + ' were stolen. James Smith was an immediate ' + G(86) + ' but he was found to have been in police custody at the time of the robbery. The police believe customers in a nearby café ' + G(87) + ' witnessed the crime and they should get in ' + G(88) + ' with Westford Police Station without ' + G(89) + '. All witness statements will be ' + G(90) + ' in the strictest confidence.') + '</div>');

  function RW(n) {
    var m = EXAM_CORE.META[n];
    return '<div class="q rw" id="q' + n + '">' + HL('div', 'stem', '<b class="qn">' + n + '.</b> ' + m.prompt.replace(/\((\w+)\)$/, '(<b>$1</b>)')) +
      '<div class="rwline"><span class="pre">' + m.prefix + '</span><textarea class="rwin" rows="1" data-q="' + n + '" autocomplete="off" spellcheck="false" aria-label="Câu ' + n + '"></textarea>' +
      (m.suffix ? '<span class="suf">' + m.suffix + '</span>' : '') + '</div></div>';
  }
  h.push(head('III. Questions 91-95: Complete each of the following sentences beginning with the words given so that it has the same meaning as the original one.'));
  for (var a = 91; a <= 95; a++) h.push(RW(a));
  h.push(head('IV. Questions 96-100: Complete the second sentence so that it has a similar meaning to the first sentence, using the word given. Do not change the word given.'));
  for (var b = 96; b <= 100; b++) h.push(RW(b));
  h.push('<p class="end">------- THE END -------</p></section>');

  return { html: h.join('\n') };
})();
