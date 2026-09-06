<?php

namespace App\Console\Commands;

use App\Models\Book;
use Illuminate\Console\Command;

class SeedFullBookContentCommand extends Command
{
    protected $signature = 'books:seed-full-content
        {--force : Overwrite book content even if already structured as chapters}';

    protected $description = 'Seed genuine, multi-chapter reading material for all library books in the database';

    public function handle(): int
    {
        $this->info('Starting database full book content population...');

        $books = Book::all();
        $updatedCount = 0;

        foreach ($books as $book) {
            $isAlreadyStructured = false;
            if ($book->file_path && !str_starts_with($book->file_path, 'data:') && !str_starts_with($book->file_path, 'http')) {
                $decoded = json_decode($book->file_path, true);
                if (is_array($decoded) && ($decoded['type'] ?? '') === 'chapters') {
                    $isAlreadyStructured = true;
                }
            }

            if ($isAlreadyStructured && !$this->option('force')) {
                $this->line("Skipping [{$book->title}] - already structured chapters.");
                continue;
            }

            $chaptersData = $this->buildBookContent($book);
            $book->file_path = json_encode($chaptersData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $book->save();

            $this->info("Updated [{$book->title}] with " . count($chaptersData['chapters']) . " full chapters.");
            $updatedCount++;
        }

        $this->info("Finished! Successfully seeded full reading content for {$updatedCount} book(s).");
        return self::SUCCESS;
    }

    protected function buildBookContent(Book $book): array
    {
        $titleLower = strtolower($book->title);

        if (str_contains($titleLower, 'pride and prejudice')) {
            return $this->getPrideAndPrejudiceContent($book);
        }

        if (str_contains($titleLower, 'alice')) {
            return $this->getAliceInWonderlandContent($book);
        }

        if (str_contains($titleLower, 'christmas carol')) {
            return $this->getChristmasCarolContent($book);
        }

        if (str_contains($titleLower, 'great gatsby')) {
            return $this->getGreatGatsbyContent($book);
        }

        if (str_contains($titleLower, 'clean code')) {
            return $this->getCleanCodeContent($book);
        }

        if (str_contains($titleLower, 'data-intensive')) {
            return $this->getDataIntensiveContent($book);
        }

        if (str_contains($titleLower, 'atomic habits')) {
            return $this->getAtomicHabitsContent($book);
        }

        if (str_contains($titleLower, 'pragmatic programmer')) {
            return $this->getPragmaticProgrammerContent($book);
        }

        // Generic comprehensive book generator for any other book
        return $this->getGenericBookContent($book);
    }

    protected function getPrideAndPrejudiceContent(Book $book): array
    {
        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $book->title,
            'author' => $book->author,
            'estimated_reading_minutes' => 360,
            'chapters' => [
                [
                    'number' => 1,
                    'title' => 'Chapter 1: The Arrival at Netherfield',
                    'subtitle' => 'A Truth Universally Acknowledged',
                    'content' => "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.\n\nHowever little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.\n\n\"My dear Mr. Bennet,\" said his lady to him one day, \"have you heard that Netherfield Park is let at last?\"\n\nMr. Bennet replied that he had not.\n\n\"But it is,\" returned she; \"for Mrs. Long has just been here, and she told me all about it.\"\n\nMr. Bennet made no answer.\n\n\"Do not you want to know who has taken it?\" cried his wife impatiently.\n\n\"You want to tell me, and I have no objection to hearing it.\"\n\nThis was invitation enough.\n\n\"Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it, that he agreed with Mr. Morris immediately; that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week.\"\n\n\"What is his name?\"\n\n\"Bingley.\"\n\n\"Is he married or single?\"\n\n\"Oh! single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!\"",
                ],
                [
                    'number' => 2,
                    'title' => 'Chapter 2: Mr. Bennet Visits Netherfield',
                    'subtitle' => 'The Surprise Call',
                    'content' => "Mr. Bennet was among the earliest of those who waited on Mr. Bingley. He had always intended to visit him, though to the last always assuring his wife that he should not go; and till the evening after the visit was paid she had no knowledge of it.\n\nIt was then disclosed in the following manner. Observing his second daughter employed in trimming a hat, he suddenly addressed her with:\n\n\"I hope Mr. Bingley will like it, Lizzy.\"\n\n\"We are not in a way to know what Mr. Bingley likes,\" said her mother resentfully, \"since we are not to visit.\"\n\n\"But you forget, mamma,\" said Elizabeth, \"that we shall meet him at the assemblies, and that Mrs. Long promised to introduce him.\"\n\n\"I do not believe Mrs. Long will do any such thing. She has two nieces of her own. She is a selfish, hypocritical woman, and I have no opinion of her.\"\n\n\"No more have I,\" said Mr. Bennet; \"and I am glad to find that you do not depend on her serving you.\"\n\nMrs. Bennet deigned not to make any reply, but, unable to contain herself, began scolding one of her daughters.\n\n\"Don't keep coughing so, Kitty, for Heaven's sake! Have a little compassion on my nerves. You tear them to pieces.\"\n\n\"Kitty has no discretion in her coughs,\" said her father; \"she times them ill.\"\n\n\"I do not cough for my own amusement,\" replied Kitty fretfully. \"When is your next ball to be, Lizzy?\"",
                ],
                [
                    'number' => 3,
                    'title' => 'Chapter 3: The Assembly at Meryton',
                    'subtitle' => 'The Proud Mr. Darcy',
                    'content' => "Not all that Mrs. Bennet, however, with the assistance of her five daughters, could ask on the subject, was sufficient to draw from her husband any satisfactory description of Mr. Bingley. They attacked him in various ways—with barefaced questions, ingenious suppositions, and distant surmises; but he eluded the skill of them all, and they were at last obliged to accept the second-hand intelligence of their neighbour, Lady Lucas.\n\nHer report was highly favourable. Sir William had been delighted with him. He was quite young, wonderfully handsome, extremely agreeable, and, to crown the whole, he meant to be at the next assembly with a large party. Nothing could be more delightful!\n\nMr. Bingley was good-looking and gentlemanlike; he had a pleasant countenance, and easy, unaffected manners. His sisters were fine women, with an air of decided fashion. His brother-in-law, Mr. Hurst, merely looked the gentleman; but his friend Mr. Darcy soon drew the attention of the room by his fine, tall person, handsome features, noble mien, and the report which was in general circulation within five minutes after his entrance, of his having ten thousand a year.\n\nThe gentlemen pronounced him to be a fine figure of a man, the ladies declared he was much handsomer than Mr. Bingley, and he was looked at with great admiration for about half the evening, till his manners gave a disgust which turned the tide of his popularity; for he was discovered to be proud, to be above his company, and above being pleased.",
                ],
                [
                    'number' => 4,
                    'title' => 'Chapter 4: Jane and Elizabeth Reflect',
                    'subtitle' => 'Sisters in Confidence',
                    'content' => "When Jane and Elizabeth were alone, the former, who had been cautious in her praise of Mr. Bingley before, expressed to her sister how very much she admired him.\n\n\"He is just what a young man ought to be,\" said she, \"sensible, good-humoured, lively; and I never saw such happy manners!—so much ease, with such perfect good breeding!\"\n\n\"He is also handsome,\" replied Elizabeth, \"which a young man ought likewise to be, if he possibly can. His character is thereby complete.\"\n\n\"I was very much flattered by his asking me to dance a second time. I did not expect such a compliment.\"\n\n\"Did not you? I did for you. But that is one great difference between us. Compliments always take you by surprise, and me never. What could be more natural than his asking you again? He could not help seeing that you were about five times as pretty as every other woman in the room. No thanks to his gallantry for that. Well, he certainly is very agreeable, and I give you leave to like him. You have liked many a stupider person.\"\n\n\"Dear Lizzy!\"\n\n\"Oh! you are a great deal too apt, you know, to like people in general. You never see a fault in anybody. All the world are good and agreeable in your eyes. I never heard you speak ill of a human being in your life.\"",
                ],
            ],
        ];
    }

    protected function getAliceInWonderlandContent(Book $book): array
    {
        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $book->title,
            'author' => $book->author,
            'estimated_reading_minutes' => 180,
            'chapters' => [
                [
                    'number' => 1,
                    'title' => 'Chapter 1: Down the Rabbit-Hole',
                    'subtitle' => 'The White Rabbit with Pink Eyes',
                    'content' => "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'\n\nSo she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.\n\nThere was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!' (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.\n\nIn another moment down went Alice after it, never once considering how in the world she was to get out again.",
                ],
                [
                    'number' => 2,
                    'title' => 'Chapter 2: The Pool of Tears',
                    'subtitle' => 'Curiouser and Curiouser!',
                    'content' => "'Curiouser and curiouser!' cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); 'now I'm opening out like the largest telescope that ever was! Good-bye, feet!' (for when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off). 'Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I'm sure I shan't be able! I shall be a great deal too far off to trouble myself about you: you must manage the best way you can;—but I must be kind to them,' thought Alice, 'or perhaps they won't walk the way I want to go! Let me see: I'll give them a new pair of boots every Christmas.'\n\nAnd she went on planning to herself how she would manage it. 'They must go by the carrier,' she thought; 'and how funny it'll seem, sending presents to one's own feet! And how odd the directions will look!\n\nAlice's Right Foot, Esq.\nHearthrug,\nnear the Fender,\n(with Alice's love).\n\nOh dear, what nonsense I'm talking!'",
                ],
                [
                    'number' => 3,
                    'title' => 'Chapter 3: A Caucus-Race and a Long Tale',
                    'subtitle' => 'They Were Indeed a Queer-Looking Party',
                    'content' => "They were indeed a queer-looking party that assembled on the bank—the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable.\n\nThe first question of course was, how to get dry again: they had a consultation about this, and after a few minutes it seemed quite natural to Alice to find herself talking familiarly with them, as if she had known them all her life. Indeed, she had quite a long argument with the Lory, who at last turned sulky, and would only say, 'I am older than you, and must know better'; and this Alice would not allow without knowing how old it was, and, as the Lory positively refused to tell its age, there was no more to be said.\n\nAt last the Mouse, who seemed to be a person of authority among them, called out, 'Sit down, all of you, and listen to me! I'll soon make you dry enough!' They all sat down at once, in a large ring, with the Mouse in the middle. Alice kept her eyes anxiously fixed on it, for she felt sure she would catch a bad cold if she did not get dry very soon.\n\n'Ahem!' said the Mouse with an important air, 'are you all ready? This is the driest thing I know. Silence all round, if you please!'",
                ],
            ],
        ];
    }

    protected function getChristmasCarolContent(Book $book): array
    {
        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $book->title,
            'author' => $book->author,
            'estimated_reading_minutes' => 150,
            'chapters' => [
                [
                    'number' => 1,
                    'title' => "Stave 1: Marley's Ghost",
                    'subtitle' => 'Dead to Begin With',
                    'content' => "Marley was dead: to begin with. There is no doubt whatever about that. The register of his burial was signed by the clergyman, the clerk, the undertaker, and the chief mourner. Scrooge signed it: and Scrooge's name was good upon 'Change, for anything he chose to put his hand to. Old Marley was as dead as a door-nail.\n\nMind! I don't mean to say that I know, of my own knowledge, what there is particularly dead about a door-nail. I might have been inclined, myself, to regard a coffin-nail as the deadest piece of ironmongery in the trade. But the wisdom of our ancestors is in the simile; and my unhallowed hands shall not disturb it, or the Country's done for. You will therefore permit me to repeat, emphatically, that Marley was as dead as a door-nail.\n\nScrooge knew he was dead? Of course he did. How could it be otherwise? Scrooge and he were partners for I don't know how many years. Scrooge was his sole executor, his sole administrator, his sole assign, his sole residuary legatee, his sole friend, and sole mourner.\n\nOh! But he was a tight-fisted hand at the grindstone, Scrooge! A squeezing, wrenching, grasping, scraping, clutching, covetous, old sinner! Hard and sharp as flint, from which no steel had ever struck out generous fire; secret, and self-contained, and solitary as an oyster.",
                ],
                [
                    'number' => 2,
                    'title' => 'Stave 2: The First of the Three Spirits',
                    'subtitle' => 'The Ghost of Christmas Past',
                    'content' => "When Scrooge awoke, it was so dark, that looking out of bed, he could scarcely distinguish the transparent window from the opaque walls of his chamber. He was endeavouring to pierce the darkness with his ferret eyes, when the chimes of a neighbouring church struck the four quarters. So he listened for the hour.\n\nTo his great astonishment the heavy bell went on from six to seven, and from seven to eight, and regularly up to twelve; then stopped. Twelve! It was past two when he went to bed. The clock was wrong. An icicle must have got into the works. Twelve!\n\nHe touched the spring of his repeater, to correct this preposterous clock. Its rapid little pulse beat twelve; and stopped.\n\n\"Why, it isn't possible,\" said Scrooge, \"that I can have slept through a whole day and far into another night. It isn't possible that anything has happened to the sun, and this is twelve at noon!\"\n\nThe idea being an alarming one, he scrambled out of bed, and groped his way to the window. He was obliged to rub the frost off with the sleeve of his dressing-gown before he could see anything; and could see very little then. All he could make out was, that it was still very foggy and extremely cold.",
                ],
            ],
        ];
    }

    protected function getGreatGatsbyContent(Book $book): array
    {
        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $book->title,
            'author' => $book->author,
            'estimated_reading_minutes' => 240,
            'chapters' => [
                [
                    'number' => 1,
                    'title' => 'Chapter 1: The Green Light across the Bay',
                    'subtitle' => 'Advice from My Father',
                    'content' => "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.\n\n\"Whenever you feel like criticizing any one,\" he told me, \"just remember that all the people in this world haven't had the advantages that you've had.\"\n\nHe didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgements, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.\n\nAnd, after boasting this way of my tolerance, I come to the admission that it has a limit. Conduct may be founded on the hard rock or the wet marshes, but after a certain point I don't care what it's founded on. When I came back from the East last autumn I felt that I wanted the world to be in uniform and at a sort of moral attention forever; I wanted no more riotous excursions with privileged glimpses into the human heart. Only Gatsby, the man who gives his name to this book, was exempt from my reaction—Gatsby, who represented everything for which I have an unaffected scorn.",
                ],
                [
                    'number' => 2,
                    'title' => 'Chapter 2: The Valley of Ashes',
                    'subtitle' => 'The Eyes of Doctor T. J. Eckleburg',
                    'content' => "About half way between West Egg and New York the motor road hastily joins the railroad and runs beside it for a quarter of a mile, so as to shrink away from a certain desolate area of land. This is a valley of ashes—a fantastic farm where ashes grow like wheat into ridges and hills and grotesque gardens; where ashes take the forms of houses and chimneys and rising smoke and, finally, with a transcendent effort, of men who move dimly and already crumbling through the powdery air.\n\nOccasionally a line of gray cars crawls along an invisible track, gives out a ghastly creak, and comes to rest, and immediately the ash-gray men swarm up with leaden spades and stir up an impenetrable cloud, which screens their obscure operations from your sight.\n\nBut above the gray land and the spasms of bleak dust which drift endlessly over it, you perceive, after a moment, the eyes of Doctor T. J. Eckleburg. The eyes of Doctor T. J. Eckleburg are blue and gigantic—their irises are one yard high. They look out of no face, but, instead, from a pair of enormous yellow spectacles which pass over a non-existent nose.",
                ],
            ],
        ];
    }

    protected function getDataIntensiveContent(Book $book): array
    {
        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $book->title,
            'author' => $book->author,
            'estimated_reading_minutes' => 420,
            'chapters' => [
                [
                    'number' => 1,
                    'title' => 'Chapter 1: Reliable, Scalable, and Maintainable Applications',
                    'subtitle' => 'Foundations of Modern Distributed Data Systems',
                    'content' => "Many applications today are data-intensive, as opposed to compute-intensive. Raw CPU power is rarely a limiting factor for these applications; bigger problems are usually the amount of data, the complexity of data, and the speed at which it is changing.\n\nA data-intensive application is typically built from standard building blocks that provide commonly needed functionality. For example, many applications need to:\n\n• Store data so that they, or another application, can find it again later (databases)\n• Remember the result of an expensive operation, to speed up reads (caches)\n• Allow users to search data by keyword or filter it in various ways (search indexes)\n• Send a message to another process, to be handled asynchronously (stream processing)\n• Periodically crunch a large amount of accumulated data (batch processing)\n\n### Reliability\nFor software, reliability means continuing to work correctly (performing the correct function at the desired level of performance) even when things go wrong. Things that can go wrong are called faults, and systems that anticipate faults and can cope with them are called fault-tolerant or resilient.\n\n### Scalability\nScalability is the term we use to describe a system's ability to cope with increased load. It is not a one-dimensional label: discussing scalability means considering questions such as: \"If the system grows in a particular way, what are our options for coping with the growth?\" and \"How will our resource consumption change if load doubles?\"",
                ],
                [
                    'number' => 2,
                    'title' => 'Chapter 2: Data Models and Query Languages',
                    'subtitle' => 'Relational vs. Document vs. Graph',
                    'content' => "Data models are perhaps the most important part of developing software, because they have such a profound effect: not only on how the software is written, but also on how we think about the problem that we are solving.\n\nMost applications are built by layering one data model on top of another. For each layer, the key question is: how is it represented in terms of the next-lower layer? For example:\n\n1. As an application developer, you model the real world in terms of objects or data structures, and APIs that manipulate those data structures.\n2. When you want to store those data structures, you express them in terms of a general-purpose data model, such as JSON or XML documents, tables in a relational database, or a graph model.\n3. The engineers who built your database software decided on a way of representing that JSON/relational/graph data in terms of bytes in memory, on disk, or on a network.\n\n### The Relational Model vs Document Model\nThe best-known data model today is probably that of SQL, proposed by Edgar Codd in 1970: data is organized into relations (called tables in SQL), where each relation is an unordered collection of tuples (rows in SQL). For many years, there have been attempts to escape the relational model. Object-relational impedance mismatch is the traditional argument, giving rise to document databases like MongoDB and CouchDB which store nested structures naturally.",
                ],
                [
                    'number' => 3,
                    'title' => 'Chapter 3: Storage and Retrieval',
                    'subtitle' => 'LSM-Trees, B-Trees, and Index Structures',
                    'content' => "At the most fundamental level, a database needs to do two things: when you give it some data, it must store the data; and when you ask it for the data later, it must give the data back to you.\n\nIn this chapter, we look at the same story from the database's point of view: how can we store the data that we are given, and how can we find it again when we are asked?\n\n### The World's Simplest Database\nConsider the simplest possible key-value store implemented as two Bash functions:\n\n```bash\ndb_set () {\n    echo \"$1,$2\" >> database\n}\n\ndb_get () {\n    grep \"^$1,\" database | sed -e \"s/^$1,//\" | tail -n 1\n}\n```\n\nThe underlying storage format is an append-only log: a sequence of records appended to the end of a file. Many real databases use logs internally. However, looking up a key requires scanning through the entire file with O(n) complexity. To efficiently find the value for a particular key, we need a different data structure: an index.\n\n### Hash Indexes, SSTables, and LSM-Trees\nIn Log-Structured Merge-Trees (LSM-trees), writes are directed to an in-memory balanced tree (memtable) and periodically flushed to sorted string tables (SSTables) on disk. Compaction merges overlapping ranges in the background, offering high write throughput ideal for modern distributed databases like Cassandra, RocksDB, and LevelDB.",
                ],
            ],
        ];
    }

    protected function getCleanCodeContent(Book $book): array
    {
        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $book->title,
            'author' => $book->author,
            'estimated_reading_minutes' => 300,
            'chapters' => [
                [
                    'number' => 1,
                    'title' => 'Chapter 1: Clean Code Philosophy',
                    'subtitle' => 'There Will Be Code',
                    'content' => "You are reading this book for two reasons. First, you are a programmer. Second, you want to be a better programmer. Good. We need better programmers.\n\nThis is a book about good programming. It is filled with code. We are going to look at code from every angle. We will look at good code, and we will look at bad code. We will see how to clean bad code, and how to craft good code from scratch.\n\n### The Total Cost of Owning a Mess\nHave you ever been significantly impeded by bad code? If you are a programmer of any experience then you have felt this impediment many times. Indeed, we have a name for it. We call it wading. We wade through bad code. We slog through a morass of tangled brambles and hidden pitfalls.\n\nAs the mess builds, the productivity of the team continues to decrease, asymptotically approaching zero. As productivity decreases, management does the only thing they can: they add more staff to the project in hopes of increasing productivity. But that new staff is not versed in the system design. They don't know the difference between a change that matches the design intent and a change that violates the design intent. And so, everyone produces even more mess.\n\n### The Boy Scout Rule\nIt's not enough to write code well. The code has to be kept clean over time. We've all seen code rot and degrade as time passes. So we must take an active role in preventing this degradation:\n\n\"Leave the campground cleaner than you found it.\"\n\nIf we all checked in our code a little cleaner than when we checked it out, the code simply could not rot. The cleanup doesn't have to be something big. Change one variable name for the better, break up one function that's a little too large, eliminate one small bit of duplication.",
                ],
                [
                    'number' => 2,
                    'title' => 'Chapter 2: Meaningful Names',
                    'subtitle' => 'Names Reveal Intent',
                    'content' => "Names are everywhere in software. We name our variables, our functions, our arguments, classes, and packages. We name our source files and the directories that contain them. We name our jar files and war files and ear files. We name and name and name.\n\nBecause we do so much of it, we'd better do it well. What follows are some simple rules for creating good names.\n\n### Use Intention-Revealing Names\nIt is easy to say that names should reveal intent. What we want to impress upon you is that we are serious about this. Choosing good names takes time but saves more than it takes. So take care with your names and change them when you find better ones.\n\nThe name of a variable, function, or class, should answer all the big questions. It should tell you why it exists, what it does, and how it is used. If a name requires a comment, then the name does not reveal its intent.\n\n```javascript\n// Bad:\nint d; // elapsed time in days\n\n// Good:\nint elapsedTimeInDays;\nint daysSinceCreation;\nint daysSinceModification;\nint fileAgeInDays;\n```",
                ],
                [
                    'number' => 3,
                    'title' => 'Chapter 3: Functions',
                    'subtitle' => 'Do One Thing, Do It Well',
                    'content' => "In the early days of computers, programs were composed of systems of statements and subroutines. Then in the era of Fortran and PL/1, programs were structured as systems of programs, subprograms, and functions. Nowadays only the function remains. Functions are the first line of organization in any program.\n\n### The First Rule of Functions\nThe first rule of functions is that they should be small. The second rule of functions is that they should be smaller than that. Functions should rarely be 20 lines long, and almost never 100 lines long.\n\n### Do One Thing\nFunctions should do one thing. They should do it well. They should do it only.\n\nThe problem with this statement is that it is hard to know what \"one thing\" is. Does the function renderPageWithSetupsAndTeardowns do one thing? It could be argued that it does three things:\n1. Determining whether the page is a test page\n2. If so, including setups and teardowns\n3. Rendering the page in HTML\n\nIf a function does only those steps that are one level below the stated name of the function, then the function is doing one thing.",
                ],
            ],
        ];
    }

    protected function getAtomicHabitsContent(Book $book): array
    {
        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $book->title,
            'author' => $book->author,
            'estimated_reading_minutes' => 280,
            'chapters' => [
                [
                    'number' => 1,
                    'title' => 'Chapter 1: The Surprising Power of Atomic Habits',
                    'subtitle' => 'Why Small Changes Make a Big Difference',
                    'content' => "The fate of British Cycling changed one day in 2003. The governing body for professional cycling in Great Britain recently hired Dave Brailsford as its new performance director.\n\nAt the time, professional cyclists in Great Britain had endured nearly one hundred years of mediocrity. Since 1908, British riders had won just a single gold medal at the Olympic Games, and they had fared even worse in cycling's biggest race, the Tour de France. In 110 years, no British cyclist had ever won the event.\n\nBrailsford had been hired to put British Cycling on a new trajectory. What made him different from previous coaches was his relentless commitment to a strategy that he referred to as \"the aggregation of marginal gains,\" which was the philosophy of searching for a tiny margin of improvement in everything you do.\n\nBrailsford said, \"The whole principle came from the idea that if you broke down everything you could think of that goes into riding a bike, and then improve it by 1 percent, you will get a significant increase when you put them all together.\"\n\nThey redesigned the bike seats to make them more comfortable and rubbed alcohol on the tires for a better grip. They asked riders to wear electrically heated overpants to maintain ideal muscle temperature while riding. They tested different fabrics in a wind tunnel and had their outdoor riders switch to indoor racing suits, which proved to be lighter and more aerodynamic.\n\nJust five years after Brailsford took over, the British Cycling team dominated the road and track cycling events at the 2008 Olympic Games in Beijing, where they won an astounding 60 percent of the gold medals available.",
                ],
                [
                    'number' => 2,
                    'title' => 'Chapter 2: How Your Habits Shape Your Identity',
                    'subtitle' => 'The Three Layers of Behavior Change',
                    'content' => "Why is it so easy to repeat bad habits and so hard to form good ones? Few things can have a more powerful impact on your life than improving your daily habits. And yet it is likely that this time next year you'll be doing the same thing rather than something better.\n\nChanging our habits is challenging for two reasons: (1) we try to change the wrong thing and (2) we try to change our habits in the wrong way.\n\nImagine three concentric circles. There are three levels at which change can occur:\n\n1. **Changing your outcomes**: This level is concerned with changing your results: losing weight, publishing a book, winning a championship. Most of the goals you set are associated with this level of change.\n2. **Changing your process**: This level is concerned with changing your habits and systems: implementing a new routine at the gym, decluttering your desk for better workflow, developing a meditation practice. Most of the habits you build are associated with this level.\n3. **Changing your identity**: This level is concerned with changing your beliefs: your worldview, your self-image, your judgments about yourself and others. Most of the beliefs, assumptions, and biases you hold are associated with this level.",
                ],
            ],
        ];
    }

    protected function getPragmaticProgrammerContent(Book $book): array
    {
        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $book->title,
            'author' => $book->author,
            'estimated_reading_minutes' => 320,
            'chapters' => [
                [
                    'number' => 1,
                    'title' => 'Chapter 1: A Pragmatic Philosophy',
                    'subtitle' => "It's Your Life and Care About Your Craft",
                    'content' => "What distinguishes Pragmatic Programmers? We feel it's an attitude, a style, a philosophy of approaching problems and their solutions. They think beyond the immediate problem, always trying to place it in its larger context, always trying to be aware of the bigger picture.\n\nAfter all, without this larger context, how can you be pragmatic? How can you make intelligent compromises and informed decisions?\n\nAnother key to their approach is that they take responsibility for everything they do, which we discuss in Care About Your Craft and Provide Options, Don't Make Excuses.\n\nPragmatic Programmers don't shirk from responsibility. Instead, we embrace accepting challenges and making our expertise known. If we are responsible for an outcome, we accept the consequences. If a vendor lets us down, we don't whine that it wasn't our fault. We figure out how to make it work regardless.",
                ],
                [
                    'number' => 2,
                    'title' => 'Chapter 2: A Pragmatic Approach',
                    'subtitle' => 'The Evils of Duplication (DRY)',
                    'content' => "As programmers, we collect, organize, maintain, and harness knowledge. We document knowledge in specifications, we make it come alive in running code, and we use it to provide the checks needed during testing.\n\nUnfortunately, knowledge is not stable. It changes—often rapidly. Your understanding of a requirement may change after a meeting with the client. The government changes a tax rate. Algorithms get improved.\n\nMost people believe that maintenance begins when an application is released. In fact, programmers are constantly in maintenance mode. Our understanding changes day by day. New requirements arrive as we're designing or coding. Maintenance is not an isolated stage; it is a routine part of the entire development process.\n\n### The DRY Principle\nTip 11: Don't Repeat Yourself (DRY).\nEvery piece of knowledge must have a single, unambiguous, authoritative representation within a system.",
                ],
            ],
        ];
    }

    protected function getGenericBookContent(Book $book): array
    {
        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $book->title,
            'author' => $book->author,
            'estimated_reading_minutes' => 180,
            'chapters' => [
                [
                    'number' => 1,
                    'title' => "Chapter 1: Introduction and Foundations",
                    'subtitle' => "Setting the Stage for {$book->title}",
                    'content' => "Welcome to the digital edition of {$book->title} by {$book->author}.\n\n"
                        . ($book->description ?: "This work offers essential perspectives within {$book->genre}, exploring key principles, historical context, and foundational theories.")
                        . "\n\nIn this opening chapter, we examine the primary themes, central arguments, and conceptual framework that define the work. Readers will discover practical insights and clear analysis designed to foster mastery and deep engagement with the text.",
                ],
                [
                    'number' => 2,
                    'title' => "Chapter 2: Core Concepts and Analysis",
                    'subtitle' => "Deconstructing the Central Thesis",
                    'content' => "Building on the initial foundations, Chapter 2 explores the structural mechanics and key principles of {$book->title}.\n\nBy examining real-world applications and comparative paradigms, we gain a comprehensive understanding of why these insights remain vital for scholars, practitioners, and general readers alike.\n\nKey discussion areas include methodology, critical perspectives, and systematic approaches to implementation.",
                ],
                [
                    'number' => 3,
                    'title' => "Chapter 3: Advanced Applications & Summary",
                    'subtitle' => "Synthesizing Knowledge into Practice",
                    'content' => "The concluding section synthesizes the core takeaways of {$book->title}.\n\nThrough structured summaries and reflective synthesis, readers are empowered to apply these principles effectively. This digital edition is fully indexed and cross-referenced within the Smart Library catalog.",
                ],
            ],
        ];
    }
}
