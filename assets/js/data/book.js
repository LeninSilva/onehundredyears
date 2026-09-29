/* Cien años de soledad — Lectura profunda
   Book-level data: structure, themes, motifs, philosophy, glossary, context.
   Citation markers [@ch:para] are rendered by app.js as Harvard-style
   parenthetical citations: (García Márquez, 2017, ch. X, para. Y).
   No part of the novel's text is stored here beyond brief quotations
   used for commentary. */

window.CIEN = window.CIEN || {};
window.CIEN.chapters = window.CIEN.chapters || [];

window.CIEN.book = {
  titleEs: "Cien años de soledad",
  titleEn: "One Hundred Years of Solitude",
  author: "Gabriel García Márquez",
  firstPublished: 1967,
  edition: "Edición ilustrada (Literatura Random House, 2017), ilustraciones de Luisa Rivera",
  reference: "García Márquez, G. (2017) <i>Cien años de soledad</i>. Illustrated edn. Illustrated by L. Rivera. Barcelona: Literatura Random House. [Originally published 1967, Buenos Aires: Editorial Sudamericana].",
  citeShort: "García Márquez, 2017",
  dedication: "Para Jomí García Ascot y María Luisa Elío",

  // First words of each chapter's opening paragraph, used to split any
  // Spanish edition of the novel into chapters when the reader loads an EPUB.
  chapterAnchors: [
    "Muchos años después, frente al pelotón",
    "Cuando el pirata Francis Drake asaltó",
    "El hijo de Pilar Ternera fue llevado",
    "La casa nueva, blanca como una paloma",
    "Aureliano Buendía y Remedios Moscote se casaron",
    "El coronel Aureliano Buendía promovió treinta",
    "En mayo terminó la guerra",
    "Sentada en el mecedor de mimbre",
    "El coronel Gerineldo Márquez fue el primero",
    "Años después, en su lecho de agonía",
    "El matrimonio estuvo a punto de acabarse",
    "Deslumbrada por tantas y tan maravillosas",
    "En el aturdimiento de los últimos años",
    "Las últimas vacaciones de Meme",
    "Los acontecimientos que habían de darle",
    "Llovió cuatro años, once meses",
    "Úrsula tuvo que hacer un grande esfuerzo",
    "Aureliano no abandonó en mucho tiempo",
    "Amaranta Úrsula regresó con los primeros",
    "Pilar Ternera murió en el mecedor"
  ],
  endAnchor: "segunda oportunidad sobre la tierra",
  expectedParas: [36,47,38,39,48,33,58,58,81,42,41,35,47,31,49,25,33,24,31,33],

  introduction: `
<p><b>Cien años de soledad</b> (1967) tells the story of seven generations of the Buendía family and of the town they found, Macondo, from its founding in a swamp "so recent that many things lacked names" to its erasure by a biblical wind. It moves through a century that mirrors the history of Colombia and Latin America: isolation and invention, civil wars between Liberals and Conservatives, the arrival of the railway and a foreign banana company, a massacre that official history denies, and a long decline into rain, dust, ants and oblivion.</p>
<p>The novel is organised in twenty untitled chapters. There are no chapter headings in the original; the Spanish titles used on this site are editorial labels, built from the book's own images, to help you find your way. Each chapter has been divided into <i>subsections</i> ("paradas", stopping points) at natural turns in the narrative, so you can slow down, read closely, highlight, and write.</p>
<p>Two formal features shape everything. First, the <b>prolepsis</b> of the first sentence ("Muchos años después…") [@1:1] establishes a narrator who sees past, present and future at once. The same "many years later" formula returns throughout the novel, and the ending explains why. Second, the novel is <b>circular</b>: names, gestures, obsessions and even sentences repeat across generations, until the last Aureliano discovers that the family's story was written in advance, "con cien años de anticipación" [@20:33].</p>
`,

  howToRead: `
<p>This is a close-reading companion for readers of English who also read Spanish. The commentary is in English. Descriptions of imagery and of characters are written in Spanish so that you stay close to the language of the novel, and every Spanish term is glossed. Quotations from the novel are brief and always cited as (García Márquez, 2017, ch., para.) so you can find them in the text.</p>
<ol>
<li><b>Load your own copy.</b> Open <a href="#/library">Your book</a> and choose the EPUB of the novel on your device. The file is processed <i>only in your browser</i> and saved on your device. It is never uploaded. The full Spanish text then appears inside every subsection, with numbered paragraphs.</li>
<li><b>Start with a chapter.</b> Read the pre-reading questions, then the deep-reading summary, then open the first subsection.</li>
<li><b>Read slowly.</b> In each subsection, read the text, highlight passages by selecting them, and stop at the "Pause and ask" questions.</li>
<li><b>Write.</b> Add notes in any subsection. When you save a note, the site automatically attaches a short quotation from that subsection that best matches what you wrote, with its citation. You can change the quotation.</li>
<li><b>Review.</b> Your <a href="#/notebook">Notebook</a> collects every note and highlight. You can export it as Markdown or JSON, and import it again on another device.</li>
</ol>
`,

  // ---- Plot structure (Freytag) --------------------------------------
  structure: [
    { id:"exposition", label:"Exposition", es:"Exposición",
      chapters:[1,2,3],
      text:`The founding world: José Arcadio Buendía and Úrsula Iguarán, cousins haunted by the fear of a child with a pig's tail, flee the ghost of Prudencio Aguilar and found Macondo [@2:16]. The gypsies bring magnets, ice and alchemy [@1:1][@1:9]. The second generation is born and grows up. Rebeca arrives with her parents' bones [@3:6]. The insomnia plague threatens collective memory [@3:9], and the state reaches Macondo in the person of the corregidor Apolinar Moscote [@3:24]. The central tensions are set out here: isolation against contact, memory against forgetting, the family against incest, and invention against repetition.`},
    { id:"rising", label:"Rising action", es:"Acción ascendente",
      chapters:[4,5,6,7,8,9],
      text:`Love rivalries (Rebeca, Amaranta and Pietro Crespi), madness (José Arcadio Buendía tied to the chestnut tree [@4:39]) and then politics. Electoral fraud turns Aureliano into Colonel Aureliano Buendía [@5:48]. Twenty years of civil war bring Arcadio's tyranny and execution [@6:33], the colonel's near-execution [@7:31], the mysterious death of José Arcadio [@7:37], the execution of General Moncada [@8:58], and the colonel's moral hollowing out. The first great peak is the Treaty of Neerlandia and his failed suicide [@9:75]: power is revealed as solitude.`},
    { id:"climax", label:"Climax", es:"Clímax",
      chapters:[10,11,12,13,14,15],
      text:`Peace brings prosperity and modernity: the twins, Remedios the Beauty, Fernanda, the train [@11:41] and the banana company [@12:3]. The pace accelerates towards catastrophe: the extermination of the seventeen Aurelianos [@12:27], the colonel's death [@13:47], the tragedy of Meme and Mauricio Babilonia [@14:31], and the <b>massacre of the striking banana workers</b> [@15:25], which the state then erases ("Aquí no ha habido muertos" [@15:37]). Most critics read the massacre as the historical and moral climax of the novel.`},
    { id:"falling", label:"Falling action", es:"Acción descendente",
      chapters:[16,17,18,19],
      text:`It rains for four years, eleven months and two days [@16:1]. Úrsula dies at an age between 115 and 122 [@17:20], the twins die on the same day [@17:30], Fernanda dies [@18:10], and the house is taken over by ants and weeds. Aureliano Babilonia, the last Buendía, studies Sanskrit in Melquíades's room. Amaranta Úrsula returns from Europe, and aunt and nephew fall in love [@19:31].`},
    { id:"denouement", label:"Denouement", es:"Desenlace",
      chapters:[20],
      text:`The child "engendrado con amor" is born with a pig's tail [@20:27]. Amaranta Úrsula dies, the ants carry off the child's body, and Aureliano finally deciphers the parchments. The family's history had been written in advance, and the story ends with the reading of it: the town is wiped out "en el instante en que Aureliano Babilonia acabara de descifrar los pergaminos" [@20:33]. This is a double climax: an <i>anagnorisis</i> (recognition) and a <i>catastrophe</i> in the same moment.`}
  ],

  familyArc: `
<p>The Buendía family is a <b>wheel</b>. Úrsula notices it more than once ("es como si el tiempo diera vueltas en redondo" [@10:30]; "el tiempo… daba vueltas en redondo" [@17:6]), and Pilar Ternera puts it best: "un engranaje de repeticiones irreparables, una rueda giratoria" that would have turned forever "de no haber sido por el desgaste progresivo e irremediable del eje" [@19:27].</p>
<p><b>Names as destiny.</b> Úrsula observes that "los Aurelianos eran retraídos, pero de mentalidad lúcida", while "los José Arcadio eran impulsivos y emprendedores, pero estaban marcados por un signo trágico" [@10:3]. The twins break the pattern because they may have swapped identities as children [@10:3], and the last Aureliano, the child of love, combines both lines [@20:24].</p>
<p><b>The incest taboo.</b> The novel opens with a marriage between cousins and a warning, the uncle born with a pig's tail [@2:2], and closes with that fear fulfilled between aunt and nephew [@20:27]. In between, the family keeps approaching the line: Rebeca and José Arcadio (adoptive siblings) [@5:18], Amaranta and Aureliano José [@8:3], Amaranta and the young José Arcadio [@14:7], and José Arcadio's fantasies about Amaranta [@18:17].</p>
<p><b>Women who hold the house.</b> Úrsula (the founder), Santa Sofía de la Piedad (the invisible one), Fernanda (the order of the highlands) and Amaranta Úrsula (the restorer) keep the house standing against war, madness and nature. Their struggle against the red ants and the weeds is the real "guerra inmemorial" of the book [@20:21].</p>
<p><b>Outsiders who carry the bloodline.</b> Pilar Ternera, a lover and never a wife, is the ancestor of every Buendía from the third generation onwards. Her body carries the bloodline that the official family denies [@6:15][@19:24].</p>
`,

  generations: [
    { g:1, label:"First generation", ids:["jose-arcadio-buendia","ursula"] },
    { g:2, label:"Second generation", ids:["jose-arcadio","coronel-aureliano","amaranta","rebeca"] },
    { g:3, label:"Third generation", ids:["arcadio","aureliano-jose","diecisiete-aurelianos"] },
    { g:4, label:"Fourth generation", ids:["remedios-la-bella","jose-arcadio-segundo","aureliano-segundo"] },
    { g:5, label:"Fifth generation", ids:["jose-arcadio-seminarista","meme","amaranta-ursula"] },
    { g:6, label:"Sixth generation", ids:["aureliano-babilonia"] },
    { g:7, label:"Seventh generation", ids:["aureliano-ultimo"] }
  ],

  // ---- Themes ---------------------------------------------------------
  themes: [
    { id:"soledad", es:"La soledad", en:"Solitude",
      text:`Solitude is the book's title word and its ethical diagnosis. It is not simply being alone. It is an inability to love that runs in the family: Úrsula concludes that the colonel's crying in the womb was "una señal inequívoca de incapacidad para el amor" [@13:7]. Every Buendía has "un aire solitario" [@8:18][@11:27]. The only child "engendrado con amor" [@20:24] ends the line. Ask yourself whether solitude is a fate, a choice, or the result of history (war, isolation, imperialism).`,
      cites:["13:7","9:39","10:37","20:24"] },
    { id:"tiempo", es:"El tiempo circular", en:"Circular time",
      text:`Linear history (inventions, railways, progress) runs inside a deeper cyclical time of repetition. José Arcadio Buendía discovers that "sigue siendo lunes" [@4:39]. Úrsula repeats "el tiempo pasa… pero no tanto" [@7:13][@17:4]. In Melquíades's room it is always "marzo y siempre era lunes" [@17:24]. The parchments compress a century so that "todos coexistieran en un instante" [@20:33].`,
      cites:["4:39","7:14","17:6","17:24","20:33"] },
    { id:"memoria", es:"La memoria y el olvido", en:"Memory and forgetting",
      text:`The insomnia plague ends in forgetting, and the town tries to hold on to reality with labels: "Esta es la vaca…" [@3:14]. In the end, a whole massacre is officially forgotten [@15:37][@15:40]. The novel itself works as a memory machine against official oblivion, like José Arcadio Buendía's "máquina de la memoria" [@3:15] and like José Arcadio Segundo's refrain: "Acuérdate siempre de que eran más de tres mil" [@17:29].`,
      cites:["3:9","3:14","15:37","17:29","18:24"] },
    { id:"poder", es:"El poder y la guerra", en:"Power and war",
      text:`The civil wars begin over "cosas que no podían tocarse con las manos" [@5:33] and end as "sólo luchamos por el poder" [@9:23]. The colonel's chalk circle of three metres [@9:13] shows how power isolates. General Moncada warns him: "has terminado por ser igual a ellos" [@8:48]. Arcadio's tyranny [@6:3] is a farcical small-scale version of the same corruption.`,
      cites:["5:33","8:48","9:13","9:23","9:39"] },
    { id:"modernidad", es:"Modernidad e imperialismo", en:"Modernity and imperialism",
      text:`Progress arrives first as wonder (magnets, ice, the daguerreotype) and then as domination. The yellow train [@11:41], Mr. Herbert's bananas [@12:2], the electrified hen-house of the gringos [@12:3], the manipulation of rain and rivers, and finally the massacre and its legal disappearance [@15:15]. "Miren la vaina que nos hemos buscado… no más por invitar un gringo a comer guineo" [@12:4].`,
      cites:["11:41","12:3","12:4","15:15","15:25"] },
    { id:"incesto", es:"El incesto y la cola de cerdo", en:"Incest and the pig's tail",
      text:`The founding fear (the cousin born with "una cola cartilaginosa en forma de tirabuzón" [@2:2]) runs through the book as warning, temptation and finally fate [@20:27]. Read it on several levels: literally, as a genetic warning; as a symbol of turning inward (endogamy, self-enclosure); and politically, as the image of a class or nation that reproduces only itself.`,
      cites:["2:2","8:13","17:19","20:27","20:33"] },
    { id:"destino", es:"Destino, profecía y escritura", en:"Fate, prophecy and writing",
      text:`Premonitions (Aureliano's pot of broth [@1:29]), card readings (Pilar Ternera's "Cuídate la boca" [@7:41]) and Melquíades's parchments shape a world where the future is already written. The final revelation makes the novel a book about reading: to finish deciphering is to finish living [@20:33]. Does writing record destiny, or create it?`,
      cites:["1:29","7:41","10:9","18:3","20:33"] },
    { id:"amor", es:"El amor", en:"Love",
      text:`Love appears as fever ("El amor es una peste" [@4:17]), as rivalry (Amaranta against Rebeca), as fear (Amaranta's "cobardía invencible" [@13:7]), as late tenderness (Aureliano Segundo and Petra Cotes in poverty [@17:7]), and finally as the only force that could redeem the line, but too late [@20:24].`,
      cites:["4:17","13:7","17:7","20:24"] },
    { id:"realismo", es:"Realismo mágico", en:"Magical realism",
      text:`The narrator tells impossible events (levitation [@5:4], a thread of blood crossing the town [@7:37], an ascension to heaven [@12:23], rain of yellow flowers [@7:58]) in the same calm tone as everyday facts, and treats real inventions (ice, the magnet, cinema) as marvels. The effect is to question the boundary between the real and the fantastic that the "official" version of history likes to police.`,
      cites:["1:32","5:4","7:37","7:58","12:23"] }
  ],

  // ---- Motifs & symbols ---------------------------------------------
  motifs: [
    { id:"hielo", es:"El hielo", en:"Ice", icon:"ice",
      text:`«El gran invento de nuestro tiempo» [@1:36]. Para el niño Aureliano el hielo «está hirviendo» [@1:35]: lo nuevo quema. José Arcadio Buendía sueña con una ciudad de casas de hielo [@2:17]; Aureliano Triste funda la fábrica [@11:27]. El hielo es el primer recuerdo y el último pensamiento del coronel [@7:31][@13:45].`,
      cites:["1:1","1:35","2:17","7:31","11:27","13:45"] },
    { id:"pescaditos", es:"Los pescaditos de oro", en:"The little gold fish", icon:"fish",
      text:`Obra artesanal del coronel: hacer y deshacer, fundir y volver a fabricar [@10:37][@13:40]. Fueron salvoconducto de guerra [@6:23], luego reliquia [@15:41], y al final moneda para comprar la gramática de sánscrito [@18:3].`,
      cites:["6:23","10:37","13:40","15:41","18:3"] },
    { id:"mariposas", es:"Las mariposas amarillas", en:"Yellow butterflies", icon:"butterfly",
      text:`Anuncian a Mauricio Babilonia [@14:23]; llenan la casa [@14:31] y acompañan a Meme hasta el convento [@15:4]. El amarillo es el color del deseo, del destino y de la muerte en la novela.`,
      cites:["14:18","14:23","14:31","15:4"] },
    { id:"flores", es:"La lluvia de flores amarillas", en:"Rain of yellow flowers", icon:"flower",
      text:`Cuando muere José Arcadio Buendía cae «una llovizna de minúsculas flores amarillas» que tapiza el pueblo [@7:58]. Las mismas florecitas brotan en el vaso de la dentadura de Melquíades [@4:19] y rompen el cemento en la decadencia [@18:6].`,
      cites:["4:19","7:58","18:6"] },
    { id:"castano", es:"El castaño", en:"The chestnut tree", icon:"tree",
      text:`Árbol del patio desde la fundación [@1:11]. José Arcadio Buendía vive y muere atado a él [@4:39][@7:56]; el coronel muere recostado en su tronco [@13:47]; allí Úrsula conversa con el marido muerto. «El primero de la estirpe está amarrado en un árbol» [@20:32].`,
      cites:["1:11","4:39","6:6","13:47","20:32"] },
    { id:"cuarto", es:"El cuarto de Melquíades", en:"Melquíades's room", icon:"room",
      text:`Espacio fuera del tiempo, inmune al polvo para quienes saben ver [@10:4] y ruina para quienes no [@12:29][@15:47]. Refugio de José Arcadio Segundo tras la masacre, donde los soldados lo miran «sin verlo» [@15:46], y laboratorio de lectura de Aureliano Babilonia.`,
      cites:["10:4","12:29","15:43","15:46","17:24"] },
    { id:"pergaminos", es:"Los pergaminos", en:"The parchments", icon:"scroll",
      text:`Escritos en sánscrito y cifrados [@20:33]; «Nadie debe conocer su sentido mientras no hayan cumplido cien años» [@10:9]. Son la novela dentro de la novela: la historia de la familia escrita de antemano.`,
      cites:["4:19","10:9","17:24","18:2","20:33"] },
    { id:"lluvia", es:"La lluvia", en:"Rain", icon:"rain",
      text:`«Está lloviendo en Macondo» [@9:8] marca la soledad de Gerineldo; el diluvio de cuatro años, once meses y dos días [@16:1] borra la compañía bananera y detiene el tiempo.`,
      cites:["9:8","15:40","16:1","16:20"] },
    { id:"hormigas", es:"Las hormigas coloradas", en:"The red ants", icon:"ant",
      text:`La naturaleza que reclama la casa [@17:1][@18:6]. La «guerra inmemorial entre el hombre y las hormigas» [@20:21] termina con el último Buendía arrastrado por ellas [@20:32].`,
      cites:["17:1","18:6","20:21","20:32"] },
    { id:"espejos", es:"Espejos y espejismos", en:"Mirrors and mirages", icon:"mirror",
      text:`La «ciudad ruidosa con casas de paredes de espejo» del sueño fundacional [@2:16]; los gemelos como «un artificio de espejos» [@9:52]; los espejos de Petra Cotes; el final «como si se estuviera viendo en un espejo hablado» y la «ciudad de los espejos (o los espejismos)» [@20:33].`,
      cites:["2:16","7:56","9:52","20:33"] },
    { id:"tierra", es:"Comer tierra", en:"Eating earth", icon:"earth",
      text:`Rebeca come tierra y cal de las paredes cuando la domina la angustia o el deseo [@3:7][@4:4][@5:18]. Es un vínculo telúrico con los muertos (sus padres en el talego) y con el origen. Úrsula al final la admira porque se alimentó «de la tierra» y no de su leche [@13:7].`,
      cites:["3:7","4:4","5:18","13:7"] },
    { id:"huesos", es:"El talego de huesos", en:"The sack of bones", icon:"bones",
      text:`El «cloc cloc cloc» de los huesos de los padres de Rebeca [@3:6], emparedados y luego sepultados [@4:30]: la memoria que no se deja enterrar.`,
      cites:["3:6","3:7","4:30"] },
    { id:"venda", es:"La venda negra de Amaranta", en:"Amaranta's black bandage", icon:"bandage",
      text:`Se quema la mano en el fogón tras el suicidio de Pietro Crespi [@6:11] y lleva la venda «hasta la muerte»: marca de culpa y de virginidad [@13:32].`,
      cites:["6:11","7:4","9:48","13:32"] },
    { id:"mortaja", es:"La mortaja", en:"The shroud", icon:"needle",
      text:`La Muerte le ordena a Amaranta tejer su propia mortaja [@14:7]; como los pescaditos, una labor para «sustentar» la soledad [@13:32].`,
      cites:["13:32","14:7","14:8"] },
    { id:"nombres", es:"Los nombres repetidos", en:"Repeated names", icon:"name",
      text:`Aurelianos y José Arcadios alternan destinos [@10:3]; los diecisiete Aurelianos con apellido materno [@8:18]; Amaranta Úrsula sueña hijos llamados Rodrigo y Gonzalo «y en ningún caso Aureliano y José Arcadio» [@19:6].`,
      cites:["10:3","8:18","19:6","20:26"] },
    { id:"cruz", es:"Las cruces de ceniza", en:"The ash crosses", icon:"cross",
      text:`Marcas indelebles en la frente de los diecisiete hijos del coronel [@11:27] que se vuelven blanco de sus asesinos [@12:27][@18:23].`,
      cites:["11:27","12:27","18:23"] },
    { id:"tren", es:"El tren amarillo", en:"The yellow train", icon:"train",
      text:`«Un asunto espantoso como una cocina arrastrando un pueblo» [@11:40]. Trae la modernidad y la compañía; lleva luego los cadáveres de la masacre al mar [@15:29]; termina «desvencijado» sin pasajeros [@17:23].`,
      cites:["11:40","11:41","15:29","17:23"] },
    { id:"casa", es:"La casa", en:"The house", icon:"house",
      text:`Construida, ampliada (Úrsula [@3:21]), empapelada de billetes [@10:27], cerrada (Fernanda [@11:20]), restaurada (Úrsula [@17:1]; Amaranta Úrsula [@19:3]) y finalmente arrancada por el viento [@20:33]. La casa es el cuerpo de la familia.`,
      cites:["3:21","10:27","11:20","17:1","19:3","20:33"] },
    { id:"alquimia", es:"Alquimia y mercurio", en:"Alchemy and mercury", icon:"flask",
      text:`El laboratorio de Melquíades [@1:9], el oro de Úrsula convertido en «chicharrón carbonizado», el mercurio que se quema para resucitar a Melquíades [@4:19] y para conservar el cadáver de Fernanda [@18:11]. Transmutación como deseo de controlar el tiempo.`,
      cites:["1:8","1:9","4:19","18:11"] },
    { id:"bacinilla", es:"La bacinilla de oro", en:"The golden chamber pot", icon:"pot",
      text:`Emblema de la falsa nobleza de Fernanda [@11:10]; «sólo tuvo de oro las incrustaciones del escudo» [@18:18].`,
      cites:["11:10","11:16","16:14","18:18"] }
  ],

  // ---- Philosophy -------------------------------------------------
  philosophy: [
    { id:"tiempo", title:"Time: cycle, line, or both?",
      body:`The novel sets the arrow of progress (invention, railway, company) against the wheel of repetition (names, gestures, obsessions). Nietzsche's eternal return, Vico's <i>corsi e ricorsi</i> and Mircea Eliade's "myth of the eternal return" are useful lenses. The ending seems to reject eternal return: "las estirpes condenadas a cien años de soledad no tenían una segunda oportunidad sobre la tierra" [@20:33]. Is the wheel broken by wear (Pilar's "desgaste… del eje" [@19:27]) or by reading?`,
      questions:["Does the novel believe history can be escaped, or only exhausted?","Why is José Arcadio Buendía's 'it is still Monday' [@4:39] at once madness and insight [@17:24]?"],
      paper:`Paper idea: "The Worn Axle: Cyclical Time and Historical Exhaustion in <i>Cien años de soledad</i>." Close-read [@4:39], [@13:10], [@17:6], [@19:27] and [@20:33].` },
    { id:"soledad", title:"Solitude as an ethical condition",
      body:`Octavio Paz (<i>El laberinto de la soledad</i>, 1950) described solitude as the condition of Latin American identity. García Márquez gives it a moral edge: "incapacidad para el amor" [@13:7]. Compare the colonel's discovery that "el secreto de una buena vejez no es otra cosa que un pacto honrado con la soledad" [@10:37] with Amaranta's "comprensión sin medidas de la soledad" [@14:7].`,
      questions:["Is solitude a punishment, a refuge, or a form of lucidity?","Which characters escape solitude, and at what cost?"],
      paper:`Paper idea: "Pacts with Solitude: Craft, Repetition and Grace." Close-read the gold fish [@10:37], the shroud [@14:7] and the parchments [@18:1].` },
    { id:"memoria", title:"Memory, testimony and official history",
      body:`After the massacre, the state's version ("no hubo muertos") wins through repetition [@15:40]. The novel dramatises the ethics of testimony: José Arcadio Segundo's count, "Tres mil cuatrocientos ocho" [@17:6], the child who keeps telling the story "sin que nadie se lo creyera" [@15:18], and Aureliano's history, which is "radicalmente contraria a la falsa que los historiadores habían admitido" [@17:24]. Compare Walter Benjamin's "Theses on the Philosophy of History" (1940) and Paul Ricœur's <i>Memory, History, Forgetting</i> (2000).`,
      questions:["Why does García Márquez make the true witnesses look mad?","What does the insomnia plague [@3:9] teach us to read in the aftermath of the massacre?"],
      paper:`Paper idea: "Aquí no ha habido muertos: Testimony against the Archive." Link [@3:14], [@15:37], [@17:24] and [@20:18].` },
    { id:"poder", title:"Power, pride and the chalk circle",
      body:`The colonel's arc reads as a study of how means consume ends: "estoy peleando por orgullo" [@7:44], then "sólo luchamos por el poder" [@9:23]. Moncada's warning [@8:48] echoes Nietzsche's line about becoming the monster you fight. Úrsula's final verdict: he won and lost "por pura y pecaminosa soberbia" [@13:7].`,
      questions:["Is the colonel a tragic hero or a figure of farce?","What is the political meaning of the chalk circle [@9:13]?"],
      paper:`Paper idea: "The Three-Metre Circle: Sovereignty and Solitude in the Colonel's Wars."` },
    { id:"libertad", title:"Freedom, fate and the written future",
      body:`If everything was written "con cien años de anticipación" [@20:33], are the characters free? Melquíades ciphers his predictions "para que no se derrotaran a sí mismas" [@19:16]. Compare Borges ("El jardín de senderos que se bifurcan"), the Stoic idea of fate, and Augustine on God's foreknowledge. Is the narrator Melquíades?`,
      questions:["Does knowing the future make it inevitable?","Why does Aureliano jump pages to read his own death [@20:33]?"],
      paper:`Paper idea: "Reading as Dying: Metafiction and Fate in the Final Chapter."` },
    { id:"realidad", title:"What is real? Magical realism as epistemology",
      body:`The novel treats marvels as normal and normal inventions as marvels. The cinema provokes a riot because a dead actor comes back to life [@12:1], while Remedios the Beauty's ascension provokes only Fernanda's envy about the sheets [@12:24]. The priest at the end: "A mí me bastaría con estar seguro de que tú y yo existimos en este momento" [@20:20]. How does the novel's form question the authority of "realism", and of states that decide what happened?`,
      questions:["When does the novel ask you to doubt, and when to believe?","Why is the massacre told with a realism the novel rarely uses?"],
      paper:`Paper idea: "Levitation and Machine Guns: The Politics of Belief in Macondo."` },
    { id:"genero", title:"Gender, the house, and invisible labour",
      body:`Men make wars and inventions; women keep the house alive (Úrsula's candy animals, Santa Sofía's silence [@18:6], Petra Cotes's raffles). Fernanda's culture of shame and Meme's silence [@15:4] show how patriarchal honour destroys women. Read with feminist criticism and with the idea of care as the hidden economy of history.`,
      questions:["Who is the true protagonist of the novel?","Why does Santa Sofía de la Piedad 'barely exist' [@6:15]?"],
      paper:`Paper idea: "Úrsula's Century: Care, Endurance and the Female Economy of Macondo."` },
    { id:"colonial", title:"Colonialism, extraction and the banana",
      body:`Macondo's history compresses colonial and neocolonial extraction: Drake's raid [@2:1], the Spanish galleon in the jungle [@1:17], the gringos' fenced town, the company that "no tenía… trabajadores a su servicio" [@15:15]. Historical anchor: the 1928 Ciénaga massacre of United Fruit Company strikers.`,
      questions:["How does the 'magic' of the company [@12:3] differ from the magic of the gypsies?","Why does the company leave behind 'un guante de Patricia Brown' [@16:21]?"],
      paper:`Paper idea: "From Drake to Mr. Brown: Extraction and Erasure in <i>Cien años de soledad</i>."` }
  ],

  // ---- Glossary (key terms, etymologies) -----------------------------
  glossary: [
    { es:"soledad", en:"solitude, loneliness", ety:"Latin <i>solitas, -atis</i>, from <i>solus</i> 'alone'. In Spanish it is also nostalgic longing (compare <i>soledades</i> in Góngora; Portuguese <i>saudade</i> shares the root)." },
    { es:"Macondo", en:"the town's name", ety:"In the novel it comes from a dream and has 'ningún significado' [@2:16]. Outside it: a banana plantation near Aracataca was called Macondo; in Bantu languages <i>makondo</i> means 'bananas'. At the end the airplane goes to the Makondos of Tanganyika [@20:9]." },
    { es:"Buendía", en:"'good day'", ety:"<i>buen</i> + <i>día</i>. The surname is ironic: a family condemned to a hundred years of solitude." },
    { es:"Aureliano", en:"(name)", ety:"Latin <i>Aurelianus</i>, from <i>aureus</i> 'golden'. Compare the gold fish, alchemy's gold and the buried doubloons." },
    { es:"Arcadio", en:"(name)", ety:"From Greek <i>Arkadía</i>, the pastoral paradise; the José Arcadios are men of instinct and earth." },
    { es:"Úrsula", en:"(name)", ety:"Latin <i>ursula</i> 'little she-bear'. She is the fierce guardian of the brood." },
    { es:"Amaranta", en:"(name)", ety:"Greek <i>amárantos</i> 'unfading', a flower that never withers: eternal virginity and a bitterness that does not fade." },
    { es:"Remedios", en:"'remedies'", ety:"From the Virgen de los Remedios; the Remedios women (Moscote, the Beauty) are brief graces." },
    { es:"Melquíades", en:"(name)", ety:"Echoes Melchizedek (Hebrew <i>Malki-tzedek</i> 'king of righteousness'), the priest without genealogy. He is also the likely narrator." },
    { es:"Babilonia", en:"Babylon", ety:"Mauricio Babilonia's surname invokes Babylon, confusion and exile; Aureliano Babilonia reads the final text." },
    { es:"gitano", en:"gypsy, Roma", ety:"From <i>egiptano</i> 'Egyptian', a medieval belief about Roma origins. In the novel they are bearers of science and wonder." },
    { es:"alquimia", en:"alchemy", ety:"Arabic <i>al-kīmiyā'</i>, from Greek <i>khēmeía</i>. The desire to transmute base metals, and time." },
    { es:"atanor", en:"athanor (alchemical furnace)", ety:"Arabic <i>at-tannūr</i> 'the oven'." },
    { es:"daguerrotipo", en:"daguerreotype", ety:"From Louis Daguerre (1839). José Arcadio Buendía tries to make 'el daguerrotipo de Dios' [@3:21]." },
    { es:"insomnio", en:"insomnia", ety:"Latin <i>in-</i> 'not' + <i>somnus</i> 'sleep'. In Macondo it leads to <i>olvido</i>." },
    { es:"olvido", en:"forgetting, oblivion", ety:"Vulgar Latin <i>*oblitare</i>, from <i>oblitus</i>." },
    { es:"corregidor", en:"magistrate, colonial official", ety:"From <i>corregir</i> 'to correct'. Hence José Arcadio Buendía's joke: 'aquí no hay nada que corregir' [@3:25]." },
    { es:"pelotón de fusilamiento", en:"firing squad", ety:"<i>pelotón</i> from French <i>peloton</i> 'little ball, group'; <i>fusil</i> from Old French 'firesteel'." },
    { es:"cachaco", en:"person from the Andean interior (Bogotá)", ety:"Colombian coastal term, often ironic, for highlanders (Fernanda, the soldiers). See [@7:10][@16:14]." },
    { es:"godo", en:"Conservative (pejorative)", ety:"Literally 'Goth'. The Liberals called Conservatives <i>godos</i> [@8:27]." },
    { es:"guajiro/a", en:"Wayuu person from La Guajira", ety:"Visitación and Cataure speak the <i>lengua guajira</i> [@3:1]." },
    { es:"pianola", en:"player piano", ety:"Trade name from <i>piano</i> + diminutive <i>-ola</i>." },
    { es:"cañabrava", en:"wild cane (building material)", ety:"<i>caña</i> + <i>brava</i> 'wild'." },
    { es:"ciénaga", en:"swamp, marsh", ety:"From <i>cieno</i> 'mud' (Latin <i>caenum</i>). The Ciénaga Grande de Santa Marta; also the town of Ciénaga, site of the 1928 massacre." },
    { es:"almendro", en:"almond tree (tropical almond)", ety:"From Latin <i>amygdala</i>. The almond trees José Arcadio Buendía planted outlive everyone [@3:2]." },
    { es:"castaño", en:"chestnut tree", ety:"Latin <i>castanea</i>." },
    { es:"cola de puerco / cola de cerdo", en:"pig's tail", ety:"The family's founding fear [@2:2]." },
    { es:"pescadito de oro", en:"little gold fish", ety:"Diminutive <i>-ito</i>: small, intimate, artisanal." },
    { es:"mortaja", en:"shroud", ety:"Possibly Arabic <i>maḍja'</i> 'resting place'." },
    { es:"sánscrito", en:"Sanskrit", ety:"<i>saṃskṛta</i> 'refined, perfected'. Melquíades's mother tongue [@20:33]." },
    { es:"pergamino", en:"parchment", ety:"From Pergamum (Greek <i>Pérgamon</i>), where parchment was developed." },
    { es:"huelga", en:"strike", ety:"From <i>holgar</i> 'to rest', Latin <i>follicare</i>." },
    { es:"compañía bananera", en:"banana company", ety:"Modelled on the United Fruit Company." },
    { es:"cantaleta", en:"nagging tirade", ety:"Colombian; Fernanda's single-sentence tirade [@16:14]." },
    { es:"antropófago", en:"cannibal", ety:"Greek <i>anthrōpophágos</i>. Amaranta Úrsula's tender nickname for Aureliano [@19:3]." },
    { es:"parranda", en:"spree, binge party", ety:"Colombian/Caribbean; Aureliano Segundo's element." },
    { es:"cumbiamba", en:"cumbia dance party", ety:"From <i>cumbia</i>, the Afro-Colombian coastal dance." },
    { es:"realismo mágico", en:"magical realism", ety:"Coined by Franz Roh (1925) for painting; developed by Alejo Carpentier's related <i>lo real maravilloso</i> (1949)." },
    { es:"prolepsis", en:"flash-forward", ety:"Greek <i>prólēpsis</i> 'anticipation'. The first sentence's 'Muchos años después'." }
  ],

  // ---- Historical & literary context ---------------------------------
  context: `
<h3>The author</h3>
<p>Gabriel García Márquez (Aracataca, Colombia, 1927 – Mexico City, 2014), Nobel Prize in Literature 1982. He grew up in his grandparents' house in Aracataca, in the Caribbean banana zone. His grandfather, Colonel Nicolás Márquez, was a veteran of the Thousand Days' War. His grandmother told impossible stories with a straight face, and García Márquez said that her tone was the key to the novel's voice.</p>
<h3>Historical anchors</h3>
<ul>
<li><b>Nineteenth-century civil wars between Liberals and Conservatives</b>. Liberal federalism, secularism and the rights of "natural" children stood against Conservative centralism and Church authority. Don Apolinar Moscote's lesson summarises the positions [@5:33].</li>
<li><b>The Thousand Days' War (1899–1902)</b>, ended by the <b>Treaty of Neerlandia</b> (24 October 1902), signed under a ceiba tree by the Liberal general Rafael Uribe Uribe, who is one model for Colonel Aureliano Buendía [@9:66].</li>
<li><b>The United Fruit Company</b> in the Magdalena banana zone (from 1899).</li>
<li><b>The banana massacre</b> in Ciénaga, 6 December 1928: the army fired on striking workers. The novel keeps the real names of General Carlos Cortés Vargas and Decree No. 4 [@15:18]. The historical death toll is disputed. The novel's "tres mil" became a symbol of that dispute.</li>
</ul>
<h3>Literary context</h3>
<ul>
<li><b>The Latin American Boom</b> (1960s): Cortázar, Fuentes, Vargas Llosa, Donoso. The novel pays homage to them with cameos: Colonel Lorenzo Gavilán "testigo del heroísmo de su compadre Artemio Cruz" (Fuentes) [@15:15]; "el cuarto… donde había de morir Rocamadour" (Cortázar, <i>Rayuela</i>) [@20:9]; the ship of Víctor Hugues (Carpentier, <i>El siglo de las luces</i>) [@5:18].</li>
<li><b>Faulkner's Yoknapatawpha</b> and Juan Rulfo's <i>Pedro Páramo</i>: invented towns, family sagas and the dead who live among the living.</li>
<li><b>Autobiographical cameos</b>: the "sabio catalán" is Ramón Vinyes, a bookseller in Barranquilla; Álvaro, Germán, Alfonso and Gabriel are the writers Álvaro Cepeda Samudio, Germán Vargas and Alfonso Fuenmayor, and García Márquez himself, "bisnieto del coronel Gerineldo Márquez" [@19:13]; Mercedes is Mercedes Barcha, his wife [@20:7]. Rafael Escalona is a real vallenato composer [@20:29].</li>
<li><b>Earlier Macondo</b>: <i>La hojarasca</i> (1955), <i>El coronel no tiene quien le escriba</i> (1961) and "Los funerales de la Mamá Grande" (1962), which is alluded to at [@4:19].</li>
</ul>
`,

  timeline: [
    { when:"16th c.", what:"Francis Drake raids Riohacha; Úrsula's great-grandmother sits on a lit stove [@2:1]." },
    { when:"Foundation", what:"José Arcadio Buendía kills Prudencio Aguilar; the exodus; the dream of Macondo [@2:16]." },
    { when:"Early years", what:"Gypsies, magnets, ice; the insomnia plague; the arrival of the corregidor [@1:1][@3:9][@3:24]." },
    { when:"First war", what:"Election fraud; Aureliano becomes a colonel [@5:48]." },
    { when:"~20 years of wars", what:"32 uprisings; Moncada executed; Neerlandia; suicide attempt [@6:1][@8:58][@9:75]." },
    { when:"Peace & prosperity", what:"The twins; Fernanda; Remedios the Beauty; the jubilee and the 17 sons [@11:27]." },
    { when:"Banana fever", what:"Train, electricity, cinema, Mr. Herbert, the company [@11:41][@12:1][@12:3]." },
    { when:"Strike", what:"Massacre at the station; the train of the dead [@15:25][@15:29]." },
    { when:"Deluge", what:"4 years, 11 months, 2 days of rain [@16:1]." },
    { when:"Decline", what:"Deaths of Úrsula, Rebeca, the twins, Fernanda, José Arcadio [@17:20][@17:30][@18:24]." },
    { when:"End", what:"Aureliano Babilonia and Amaranta Úrsula; the child with the tail; the wind [@20:33]." }
  ],

  // Bilingual lexicon to connect English notes with Spanish text for the
  // automatic quotation feature (English word -> Spanish stems).
  lexicon: {
    ice:["hielo"], magnet:["iman"], gold:["oro","dorad"], fish:["pescad","pez","peces"], butterfly:["mariposa"], butterflies:["mariposa"],
    yellow:["amarill"], rain:["lluvi","llov"], flood:["diluvi","lluvi"], ant:["hormig"], ants:["hormig"], war:["guerr"], wars:["guerr"],
    love:["amor","quer","enamor"], solitude:["soledad","solitari","solo","sola"], lonely:["soledad","solitari"], alone:["solo","sola","soledad"],
    time:["tiempo"], memory:["memori","recuerd","record"], remember:["record","recuerd","acord"], forget:["olvid"], forgetting:["olvid"], oblivion:["olvid"],
    death:["muert","muri","morir"], die:["muer","morir","muri"], dead:["muert","muerto"], ghost:["fantasm","muerto","espectr","apareci"],
    house:["casa"], home:["casa","hogar"], mother:["madre","mama"], father:["padre","papa"], son:["hijo"], daughter:["hija"], child:["niño","nino","hijo","criatura"],
    children:["niños","ninos","hijos"], family:["familia","estirpe"], lineage:["estirpe","sangre"], blood:["sangre"], incest:["sangre","tia","primo","hermana"],
    pig:["cerdo","puerco","cochin"], tail:["cola"], name:["nombre"], names:["nombre"], dream:["sueñ","suen","soñ"], dreams:["sueñ","suen"],
    sleep:["dorm","sueñ","insomni"], insomnia:["insomni"], plague:["peste"], madness:["loc"], crazy:["loc"], mad:["loc"],
    tree:["arbol","castañ"], chestnut:["castañ"], rope:["amarr","soga"], tied:["amarr"], train:["tren"], banana:["banan","guineo"],
    company:["compañ"], strike:["huelg"], workers:["trabajador","obrer"], massacre:["masacr","matanz","ametrall"], soldiers:["soldad","militar","ejercit"],
    army:["ejercit","soldad"], government:["gobiern"], power:["poder"], pride:["orgull","soberbi"], glory:["glori"], colonel:["coronel"],
    firing:["fusil","pelot"], squad:["pelot"], execution:["fusil","ejecuc"], liberal:["liberal"], conservative:["conservador","godo"],
    gypsy:["gitan"], gypsies:["gitan"], invention:["invent"], science:["cienci","sabio"], alchemy:["alquim"], mercury:["mercuri"],
    parchments:["pergamin"], parchment:["pergamin"], manuscript:["manuscrit","pergamin"], prophecy:["predic","profet","pronost"], fate:["destino"], destiny:["destino"],
    cards:["baraj","naip"], future:["porvenir","futuro"], past:["pasado"], nostalgia:["nostalgi","añor"], sea:["mar"], river:["rio"], swamp:["cienag"],
    wind:["viento","huracan"], dust:["polvo"], heat:["calor"], bones:["hueso"], earth:["tierra"], eat:["com"], eating:["com"],
    beauty:["bell","hermos"], beautiful:["bell","hermos"], virgin:["virgen","doncella"], shroud:["mortaja","sudario"], bandage:["venda"], hand:["mano"],
    jealous:["celos","envidi","rencor"], jealousy:["celos","envidi"], hatred:["odio","rencor"], hate:["odi","rencor"], fear:["miedo","pavor","terror","temor"],
    silence:["silenci","callad"], laugh:["risa","rei"], cry:["llor","llant"], tears:["lagrim","llant"], wedding:["boda","casar","matrimoni"], marry:["casar"],
    priest:["padre","cura","parroco"], god:["dios"], church:["iglesi","templo"], pope:["papa"], saint:["santo"], sin:["pecad"],
    queen:["reina"], king:["rey"], rich:["riqu","fortun"], money:["diner","plata","billete"], poverty:["pobre","miseri"], hunger:["hambre"],
    body:["cuerpo"], naked:["desnud"], smell:["olor"], light:["luz"], dark:["oscur","tinieblas"], blind:["ciega","ciego"], eyes:["ojos"],
    mirror:["espejo"], mirrors:["espejo"], letters:["carta"], letter:["carta"], read:["le","lectur"], write:["escrib"], writing:["escrit"], book:["libro"], books:["libro"],
    circle:["circulo","redond"], repetition:["repet","vueltas"], cycle:["vueltas","redond","circulo"], monday:["lunes"], old:["viej","vejez","anciano"], age:["edad","años"],
    young:["joven","juventud"], work:["trabaj"], ruin:["ruina","escombro","destruc"], decay:["ruina","podr","destruc"], nature:["naturaleza","maleza"],
    wonder:["asombr","maravill","prodig"], miracle:["milagr"], magic:["magi","hechiz"], levitation:["elev","levit"], ascension:["elev","cielo","sabanas"],
    sheets:["sabana"], flowers:["flor"], flower:["flor"], candy:["caramelo"], shame:["vergüenz","verguenz"], honor:["honor","honra"], truth:["verdad"], lie:["mentir","mentira"], lies:["mentira"]
  }
};
