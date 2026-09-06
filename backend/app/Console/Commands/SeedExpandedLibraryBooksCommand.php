<?php

namespace App\Console\Commands;

use App\Models\Book;
use App\Models\BookCopy;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SeedExpandedLibraryBooksCommand extends Command
{
    protected $signature = 'books:seed-expanded-library
        {--force : Overwrite book data and content even if already seeded}';

    protected $description = 'Seed 20 additional high-quality books across diverse genres into the library database with full multi-chapter reading material';

    public function handle(): int
    {
        $this->info('Starting expanded library catalog seeding (20 books across diverse genres)...');

        $booksCatalog = $this->getBooksCatalogDefinition();
        $createdCount = 0;
        $updatedCount = 0;

        foreach ($booksCatalog as $bookDef) {
            $isbn = $bookDef['isbn'];
            $existing = Book::where('isbn', $isbn)->first();

            if ($existing && !$this->option('force')) {
                $this->line("Skipping [{$bookDef['title']}] - already exists (use --force to overwrite).");
                continue;
            }

            $this->line("Processing [{$bookDef['title']}] ({$bookDef['genre']})...");

            // Build chapter structured content
            $chapterData = $this->buildChaptersForBook($bookDef);
            $filePathJson = json_encode($chapterData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            $book = Book::updateOrCreate(
                ['isbn' => $isbn],
                [
                    'title' => $bookDef['title'],
                    'author' => $bookDef['author'],
                    'publisher' => $bookDef['publisher'],
                    'genre' => $bookDef['genre'],
                    'description' => $bookDef['description'],
                    'cover_image_path' => $bookDef['cover_image_path'],
                    'publication_year' => $bookDef['publication_year'],
                    'total_copies' => $bookDef['total_copies'] ?? 4,
                    'available_copies' => $bookDef['available_copies'] ?? 4,
                    'is_exclusive' => $bookDef['is_exclusive'] ?? false,
                    'digital_purchase_price' => $bookDef['digital_purchase_price'] ?? 40.00,
                    'file_path' => $filePathJson,
                ]
            );

            // Seed Physical Book Copies
            $cleanIsbn = str_replace('-', '', $book->isbn);
            for ($i = 1; $i <= $book->total_copies; $i++) {
                $barcode = 'BC-' . $cleanIsbn . '-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT);
                BookCopy::firstOrCreate(
                    ['barcode' => $barcode],
                    [
                        'book_id' => $book->id,
                        'condition' => 'good',
                        'status' => 'available',
                        'location_rack' => 'Rack-' . (($book->id + $i) % 10 + 1),
                    ]
                );
            }

            if ($existing) {
                $updatedCount++;
            } else {
                $createdCount++;
            }

            $this->info("✓ [{$book->title}] successfully seeded with " . count($chapterData['chapters']) . " readable chapters.");
        }

        $this->info("Completed! Created: {$createdCount}, Updated: {$updatedCount}. Total books processed: " . count($booksCatalog));
        return self::SUCCESS;
    }

    protected function getBooksCatalogDefinition(): array
    {
        return [
            // 1. Sci-Fi / Gothic Horror
            [
                'isbn' => '978-0141439471',
                'title' => 'Frankenstein; or, The Modern Prometheus',
                'author' => 'Mary Shelley',
                'publisher' => 'Lackington, Hughes, Harding, Mavor, & Jones',
                'genre' => 'Science Fiction',
                'description' => 'The chilling story of Victor Frankenstein, a young scientist who creates a sapient creature in an unorthodox scientific experiment, exploring the boundary between science and morality.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1818,
                'total_copies' => 4,
                'available_copies' => 3,
                'is_exclusive' => false,
                'digital_purchase_price' => 28.00,
                'gutenberg_id' => 84,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/84/pg84.txt',
            ],
            // 2. Mystery / Detective
            [
                'isbn' => '978-0141034355',
                'title' => 'The Adventures of Sherlock Holmes',
                'author' => 'Arthur Conan Doyle',
                'publisher' => 'George Newnes',
                'genre' => 'Mystery',
                'description' => 'A collection of twelve short stories featuring master detective Sherlock Holmes and Dr. John Watson investigating puzzling mysteries across Victorian London.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1892,
                'total_copies' => 5,
                'available_copies' => 5,
                'is_exclusive' => true,
                'digital_purchase_price' => 32.00,
                'gutenberg_id' => 1661,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/1661/pg1661.txt',
            ],
            // 3. Adventure / Classic
            [
                'isbn' => '978-0141321004',
                'title' => 'Treasure Island',
                'author' => 'Robert Louis Stevenson',
                'publisher' => 'Cassell & Co.',
                'genre' => 'Adventure',
                'description' => 'An adventure novel narrating a tale of "buccaneers and buried gold", introducing legendary figures like Long John Silver, Jim Hawkins, and Captain Flint.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1883,
                'total_copies' => 4,
                'available_copies' => 4,
                'is_exclusive' => false,
                'digital_purchase_price' => 25.00,
                'gutenberg_id' => 120,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/120/pg120.txt',
            ],
            // 4. Horror / Gothic
            [
                'isbn' => '978-0141439846',
                'title' => 'Dracula',
                'author' => 'Bram Stoker',
                'publisher' => 'Archibald Constable and Company',
                'genre' => 'Horror',
                'description' => 'The archetypal vampire tale told through letters, diary entries, and newspaper clippings of Count Dracula\'s sinister attempt to move from Transylvania to England.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1897,
                'total_copies' => 5,
                'available_copies' => 4,
                'is_exclusive' => true,
                'digital_purchase_price' => 35.00,
                'gutenberg_id' => 345,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/345/pg345.txt',
            ],
            // 5. Classic Fiction / Philosophy
            [
                'isbn' => '978-0141439570',
                'title' => 'The Picture of Dorian Gray',
                'author' => 'Oscar Wilde',
                'publisher' => 'Ward, Lock and Company',
                'genre' => 'Classic',
                'description' => 'A philosophical novel exploring aestheticism, vanity, and moral corruption through a portrait that ages and bears the sins of a perpetually youthful gentleman.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1890,
                'total_copies' => 3,
                'available_copies' => 3,
                'is_exclusive' => false,
                'digital_purchase_price' => 29.00,
                'gutenberg_id' => 174,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/174/pg174.txt',
            ],
            // 6. Philosophy / Political Science
            [
                'isbn' => '978-0140449143',
                'title' => 'The Republic',
                'author' => 'Plato',
                'publisher' => 'Penguin Classics',
                'genre' => 'Philosophy',
                'description' => 'Socrates and his interlocutors examine the definition of justice, the order and character of the just city-state, and the nature of the philosopher king.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1955,
                'total_copies' => 4,
                'available_copies' => 4,
                'is_exclusive' => true,
                'digital_purchase_price' => 38.00,
                'gutenberg_id' => 1497,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/1497/pg1497.txt',
            ],
            // 7. Philosophy / Stoicism
            [
                'isbn' => '978-0140449334',
                'title' => 'Meditations',
                'author' => 'Marcus Aurelius',
                'publisher' => 'Penguin Classics',
                'genre' => 'Philosophy',
                'description' => 'A series of personal writings by Roman Emperor Marcus Aurelius recording his private thoughts on Stoic philosophy, duty, resilience, and inner tranquility.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 2006,
                'total_copies' => 6,
                'available_copies' => 5,
                'is_exclusive' => false,
                'digital_purchase_price' => 30.00,
                'gutenberg_id' => 2680,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/2680/pg2680.txt',
            ],
            // 8. Military Strategy / History
            [
                'isbn' => '978-1590302255',
                'title' => 'The Art of War',
                'author' => 'Sun Tzu',
                'publisher' => 'Shambhala Publications',
                'genre' => 'History',
                'description' => 'An ancient Chinese military treatise attributed to Sun Tzu, devoted to the strategic, operational, and tactical aspects of warfare and negotiation.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1533669955142-6a73332af4db?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 2005,
                'total_copies' => 4,
                'available_copies' => 3,
                'is_exclusive' => false,
                'digital_purchase_price' => 26.00,
                'gutenberg_id' => 132,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/132/pg132.txt',
            ],
            // 9. Science Fiction
            [
                'isbn' => '978-0141439976',
                'title' => 'The Time Machine',
                'author' => 'H.G. Wells',
                'publisher' => 'William Heinemann',
                'genre' => 'Science Fiction',
                'description' => 'A Victorian scientist builds a machine capable of journeying through the fourth dimension, travelling to the year A.D. 802,701 to encounter the Eloi and Morlocks.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1895,
                'total_copies' => 4,
                'available_copies' => 4,
                'is_exclusive' => false,
                'digital_purchase_price' => 24.00,
                'gutenberg_id' => 35,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/35/pg35.txt',
            ],
            // 10. Thriller / Mystery
            [
                'isbn' => '978-0141439730',
                'title' => 'The Strange Case of Dr. Jekyll and Mr. Hyde',
                'author' => 'Robert Louis Stevenson',
                'publisher' => 'Longmans, Green & Co.',
                'genre' => 'Mystery',
                'description' => 'A chilling Gothic novella concerning lawyer Gabriel John Utterson investigating the strange occurrences between his mild friend Dr Henry Jekyll and the wicked Edward Hyde.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1886,
                'total_copies' => 4,
                'available_copies' => 4,
                'is_exclusive' => false,
                'digital_purchase_price' => 22.00,
                'gutenberg_id' => 43,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/43/pg43.txt',
            ],
            // 11. Romance / Classic Drama
            [
                'isbn' => '978-0141439662',
                'title' => 'Sense and Sensibility',
                'author' => 'Jane Austen',
                'publisher' => 'Thomas Egerton',
                'genre' => 'Romance',
                'description' => 'The story of the Dashwood sisters, Elinor (sensible) and Marianne (emotional), as they experience love, heartbreak, and societal pressures in Regency England.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1811,
                'total_copies' => 4,
                'available_copies' => 3,
                'is_exclusive' => false,
                'digital_purchase_price' => 30.00,
                'gutenberg_id' => 161,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/161/pg161.txt',
            ],
            // 12. Psychological / Absurdist Fiction
            [
                'isbn' => '978-0143105244',
                'title' => 'The Metamorphosis',
                'author' => 'Franz Kafka',
                'publisher' => 'Kurt Wolff Verlag',
                'genre' => 'Fiction',
                'description' => 'Gregor Samsa, a travelling salesman, wakes up one morning to find himself transformed into a monstrous vermin, confronting human alienation and family dynamics.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1915,
                'total_copies' => 5,
                'available_copies' => 5,
                'is_exclusive' => true,
                'digital_purchase_price' => 25.00,
                'gutenberg_id' => 5200,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/5200/pg5200.txt',
            ],
            // 13. Biography / History
            [
                'isbn' => '978-0142437100',
                'title' => 'The Autobiography of Benjamin Franklin',
                'author' => 'Benjamin Franklin',
                'publisher' => 'Penguin Books',
                'genre' => 'Biography',
                'description' => 'The famous memoir of founding father Benjamin Franklin, detailing his early printing career, scientific discoveries with electricity, civic contributions, and thirteen virtues.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1793,
                'total_copies' => 3,
                'available_copies' => 3,
                'is_exclusive' => false,
                'digital_purchase_price' => 34.00,
                'gutenberg_id' => 2020,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/2020/pg2020.txt',
            ],
            // 14. Economics / Political Economy
            [
                'isbn' => '978-0140432084',
                'title' => 'The Wealth of Nations',
                'author' => 'Adam Smith',
                'publisher' => 'W. Strahan and T. Cadell',
                'genre' => 'Economics',
                'description' => 'The foundational magnum opus of classical economics, analyzing the division of labor, productivity, market forces, and the famous invisible hand concept.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1776,
                'total_copies' => 4,
                'available_copies' => 4,
                'is_exclusive' => true,
                'digital_purchase_price' => 55.00,
                'gutenberg_id' => 3300,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/3300/pg3300.txt',
            ],
            // 15. Historical Fiction
            [
                'isbn' => '978-0141439600',
                'title' => 'A Tale of Two Cities',
                'author' => 'Charles Dickens',
                'publisher' => 'Chapman & Hall',
                'genre' => 'History',
                'description' => '"It was the best of times, it was the worst of times." An epic historical novel set in London and Paris before and during the Reign of Terror of the French Revolution.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1859,
                'total_copies' => 4,
                'available_copies' => 4,
                'is_exclusive' => false,
                'digital_purchase_price' => 28.00,
                'gutenberg_id' => 98,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/98/pg98.txt',
            ],
            // 16. Epic Poetry / Mythology
            [
                'isbn' => '978-0140449112',
                'title' => 'The Odyssey',
                'author' => 'Homer',
                'publisher' => 'Penguin Classics',
                'genre' => 'Poetry',
                'description' => 'The epic journey of Greek hero Odysseus as he voyages home to Ithaca after the fall of Troy, encountering cyclopes, sirens, sorceresses, and monsters.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1999,
                'total_copies' => 4,
                'available_copies' => 3,
                'is_exclusive' => false,
                'digital_purchase_price' => 30.00,
                'gutenberg_id' => 1727,
                'gutenberg_url' => 'https://www.gutenberg.org/cache/epub/1727/pg1727.txt',
            ],
            // 17. Technology / Artificial Intelligence
            [
                'isbn' => '978-0134610993',
                'title' => 'Artificial Intelligence: A Modern Approach',
                'author' => 'Stuart Russell & Peter Norvig',
                'publisher' => 'Pearson',
                'genre' => 'Technology',
                'description' => 'The leading textbook in Artificial Intelligence, covering intelligent agents, informed search algorithms, constraint satisfaction, probabilistic reasoning, and deep reinforcement learning.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 2020,
                'total_copies' => 5,
                'available_copies' => 4,
                'is_exclusive' => true,
                'digital_purchase_price' => 85.00,
            ],
            // 18. Business / Innovation
            [
                'isbn' => '978-0804139298',
                'title' => 'Zero to One: Notes on Startups, or How to Build the Future',
                'author' => 'Peter Thiel & Blake Masters',
                'publisher' => 'Crown Business',
                'genre' => 'Business',
                'description' => 'Legendary investor Peter Thiel presents philosophy on proprietary technology, vertical monopolies, network effects, secrets, and creating completely new categories.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 2014,
                'total_copies' => 4,
                'available_copies' => 4,
                'is_exclusive' => false,
                'digital_purchase_price' => 45.00,
            ],
            // 19. Productivity / Self-Help
            [
                'isbn' => '978-1455586691',
                'title' => 'Deep Work: Rules for Focused Success in a Distracted World',
                'author' => 'Cal Newport',
                'publisher' => 'Grand Central Publishing',
                'genre' => 'Productivity',
                'description' => 'Deep work is the ability to focus without distraction on a cognitively demanding task. Learn actionable rules to master complicated information and produce better results in less time.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 2016,
                'total_copies' => 4,
                'available_copies' => 3,
                'is_exclusive' => false,
                'digital_purchase_price' => 36.00,
            ],
            // 20. Astrophysics / Cosmology
            [
                'isbn' => '978-0553380163',
                'title' => 'A Brief History of Time',
                'author' => 'Stephen Hawking',
                'publisher' => 'Bantam Books',
                'genre' => 'Science',
                'description' => 'A landmark volume in science writing by world-renowned theoretical physicist Stephen Hawking, exploring black holes, gravitational singularities, the Big Bang, and the nature of time.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1988,
                'total_copies' => 5,
                'available_copies' => 4,
                'is_exclusive' => false,
                'digital_purchase_price' => 42.00,
            ],
        ];
    }

    protected function buildChaptersForBook(array $bookDef): array
    {
        // Check if Gutenberg title
        if (!empty($bookDef['gutenberg_id']) && !empty($bookDef['gutenberg_url'])) {
            $gutenbergChapters = $this->parseGutenbergBook($bookDef['gutenberg_id'], $bookDef['gutenberg_url'], $bookDef['title'], $bookDef['author']);
            if (!empty($gutenbergChapters) && count($gutenbergChapters) >= 3) {
                return [
                    'type' => 'chapters',
                    'version' => '2.0',
                    'book_title' => $bookDef['title'],
                    'author' => $bookDef['author'],
                    'total_chapters' => count($gutenbergChapters),
                    'estimated_reading_minutes' => count($gutenbergChapters) * 35,
                    'chapters' => $gutenbergChapters,
                ];
            }
        }

        // Custom rich multi-chapter builder for specialized technical / business / modern books
        $titleLower = strtolower($bookDef['title']);

        if (str_contains($titleLower, 'artificial intelligence')) {
            return $this->getAiModernApproachContent($bookDef);
        }

        if (str_contains($titleLower, 'zero to one')) {
            return $this->getZeroToOneContent($bookDef);
        }

        if (str_contains($titleLower, 'deep work')) {
            return $this->getDeepWorkContent($bookDef);
        }

        if (str_contains($titleLower, 'brief history of time')) {
            return $this->getBriefHistoryOfTimeContent($bookDef);
        }

        return $this->getRichCuratedCurriculum($bookDef);
    }

    protected function parseGutenbergBook(int $id, string $url, string $title, string $author): array
    {
        $cacheDir = storage_path('app/gutenberg_cache');
        if (!is_dir($cacheDir)) {
            @mkdir($cacheDir, 0777, true);
        }
        $cacheFile = $cacheDir . "/pg{$id}.txt";
        $raw = null;

        if (file_exists($cacheFile) && filesize($cacheFile) > 10000) {
            $raw = file_get_contents($cacheFile);
        } else {
            try {
                $this->line("Downloading Gutenberg text #{$id}...");
                $res = Http::withoutVerifying()->timeout(45)->get($url);
                if ($res->successful()) {
                    $raw = $res->body();
                    file_put_contents($cacheFile, $raw);
                }
            } catch (\Throwable $e) {
                $this->warn("Gutenberg download note for #{$id}: " . $e->getMessage());
            }
        }

        if (!$raw) {
            return [];
        }

        $raw = str_replace("\r\n", "\n", $raw);
        $startPos = strpos($raw, '*** START OF THE PROJECT GUTENBERG');
        if ($startPos !== false) {
            $raw = substr($raw, strpos($raw, "\n", $startPos) + 1);
        }
        $endPos = strpos($raw, '*** END OF THE PROJECT GUTENBERG');
        if ($endPos !== false) {
            $raw = substr($raw, 0, $endPos);
        }

        // Split chapters using flexible roman or numeric regex
        $parts = preg_split('/\n\s*(?:CHAPTER|STORY|BOOK|LETTER|PART)\s+([IVXLCDM\d]+[^\n]*)\n/i', $raw, -1, PREG_SPLIT_DELIM_CAPTURE);

        if (count($parts) < 4) {
            $parts = preg_split('/\n\s*([IVXLCDM]{1,8})\.?\s*\n\n/i', $raw, -1, PREG_SPLIT_DELIM_CAPTURE);
        }

        if (count($parts) < 4) {
            return [];
        }

        $chapters = [];
        $chapNum = 1;

        for ($i = 1; $i < count($parts); $i += 2) {
            $chapHeader = trim($parts[$i] ?? '');
            $chapText = trim($parts[$i + 1] ?? '');

            if (strlen($chapText) < 200) {
                continue;
            }

            // Limit huge single chapters to reasonable reading chunks if necessary
            $paras = explode("\n\n", $chapText);
            $cleanParas = [];
            foreach ($paras as $p) {
                $cleaned = trim(preg_replace('/\s+/', ' ', $p));
                if (strlen($cleaned) > 10) {
                    $cleanParas[] = $cleaned;
                }
            }

            $chapters[] = [
                'number' => $chapNum,
                'title' => "Chapter {$chapNum}: " . (strlen($chapHeader) < 40 && $chapHeader !== '' ? $chapHeader : "Section {$chapNum}"),
                'subtitle' => "From {$title} by {$author}",
                'content' => implode("\n\n", array_slice($cleanParas, 0, 50)),
            ];

            $chapNum++;
            if ($chapNum > 30) {
                break;
            }
        }

        return $chapters;
    }

    protected function getAiModernApproachContent(array $bookDef): array
    {
        $curriculum = [
            ['Introduction to Artificial Intelligence', 'What is AI? Acting humanly, thinking humanly, thinking rationally, and acting rationally.'],
            ['Intelligent Agents & Environments', 'The nature of environments (PEAS), agent architectures, reflex agents, goal-based and utility-based systems.'],
            ['Solving Problems by Searching', 'Uninformed search (BFS, DFS, Uniform Cost) versus Informed Search (A* Search, heuristics admissibility and consistency).'],
            ['Adversarial Search and Games', 'Optimal decisions in games, Minimax algorithm, Alpha-Beta pruning, evaluation functions, and Monte Carlo Tree Search (MCTS).'],
            ['Constraint Satisfaction Problems', 'Constraint propagation, Backtracking search for CSPs, Arc consistency (AC-3), MRV and forward checking heuristics.'],
            ['Knowledge Representation and Logic', 'Propositional logic, First-order logic, inference with resolution, unification, and forward/backward chaining.'],
            ['Probabilistic Reasoning & Bayesian Networks', 'Uncertainty, conditional probability, Bayes Rule, exact inference by variable elimination, and Markov models.'],
            ['Deep Learning and Neural Networks', 'Multilayer perceptrons, backpropagation gradients, convolutional networks, transformers, and self-attention mechanisms.'],
            ['Reinforcement Learning', 'Passive versus active RL, Q-learning, temporal-difference learning, Bellman equations, and policy search.'],
            ['The Ethics and Future of AI', 'Safety, alignment, bias mitigation, autonomy, existential risk, and societal impact of artificial intelligence.'],
        ];

        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $bookDef['title'],
            'author' => $bookDef['author'],
            'total_chapters' => count($curriculum),
            'estimated_reading_minutes' => 480,
            'chapters' => array_map(function ($idx, $item) use ($bookDef) {
                $num = $idx + 1;
                return [
                    'number' => $num,
                    'title' => "Chapter {$num}: {$item[0]}",
                    'subtitle' => $item[1],
                    'content' => "### Chapter Overview\n{$item[1]}\n\nIn this foundational chapter of {$bookDef['title']}, Stuart Russell and Peter Norvig explore the core algorithmic paradigms that govern rational agent behavior. Intelligence is not defined merely by internal cogitation, but by selecting actions that maximize expected utility given an agent's perceptual history.\n\n### Core Theoretical Concepts\n• Rationality vs. Omniscience: Rationality maximizes expected performance given knowledge, whereas omniscience requires knowing the actual outcome.\n• Search Formulations: Initial state, Actions(s), Result(s, a), GoalTest(s), and PathCost(s, a, s').\n• Optimality Criteria: Completeness (always finding a solution), Time complexity, Space complexity, and Optimality (finding lowest cost solution).\n\n### Practical Implementations\nModern intelligent systems decompose complex decision environments into structured state spaces. From self-driving navigation systems to large language models, the core architecture balances exploration with exploitation, validating probabilistic models against continuous sensory feedback.",
                ];
            }, array_keys($curriculum), $curriculum),
        ];
    }

    protected function getZeroToOneContent(array $bookDef): array
    {
        $curriculum = [
            ['The Challenge of the Future: Zero to One', 'Horizontal versus vertical progress: copying things that work (1 to n) versus doing new things (0 to 1).'],
            ['Party Like It\'s 1999', 'Lessons from the dot-com bubble crash: why boldness, proprietary tech, and long-term planning trump conventional wisdom.'],
            ['All Happy Companies Are Different', 'Monopoly capitalism versus perfect competition: why creative monopolies drive human innovation and long-term value.'],
            ['The Ideology of Competition', 'Why competition is an ideology that warps thinking, diminishes profit margins, and distracts from true value creation.'],
            ['Last Mover Advantage', 'It is better to be the last mover—making the final great development in a specific market and enjoying decades of monopoly profits.'],
            ['You Are Not a Lottery Ticket', 'Definite optimism versus indefinite optimism: how intentional design and deliberate planning shape the future.'],
            ['Follow the Money: The Power Law', 'The venture capital power law: why the best investment in a fund outperforms all other investments combined.'],
            ['Secrets: The World\'s Hidden Truths', 'Why conventional people stop believing in secrets, and how discovering truths that few people agree with builds enduring companies.'],
            ['Foundations and Distribution', 'Thiel\'s Law: A startup messed up at its foundation cannot be fixed. The critical importance of sales, marketing, and distribution.'],
            ['Man and Machine: Technology as Complement', 'Computers are complements for humans, not substitutes. The most valuable businesses empower humans with technological leverage.'],
        ];

        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $bookDef['title'],
            'author' => $bookDef['author'],
            'total_chapters' => count($curriculum),
            'estimated_reading_minutes' => 360,
            'chapters' => array_map(function ($idx, $item) use ($bookDef) {
                $num = $idx + 1;
                return [
                    'number' => $num,
                    'title' => "Chapter {$num}: {$item[0]}",
                    'subtitle' => $item[1],
                    'content' => "### Core Thesis\n{$item[1]}\n\nIn {$bookDef['title']}, Peter Thiel and Blake Masters assert that every great moment in business happens only once. The next Bill Gates will not build an operating system. The next Larry Page won't make a search engine. If you are copying these companies, you are not learning from them.\n\n### The Four Pillars of Creative Monopolies\n• Proprietary Technology: Must be at least 10x better than its closest substitute in some important dimension.\n• Network Effects: Makes a product more useful as more people use it, starting with small, concentrated markets.\n• Economies of Scale: A great business gets stronger as it gets bigger, with near-zero marginal cost of reproduction.\n• Branding: A company has a monopoly on its own brand by definition, but branding without substance is fleeting.",
                ];
            }, array_keys($curriculum), $curriculum),
        ];
    }

    protected function getDeepWorkContent(array $bookDef): array
    {
        $curriculum = [
            ['Deep Work Is Valuable', 'The high-value skills of the new economy: the ability to quickly master hard things and produce at an elite level.'],
            ['Deep Work Is Rare', 'The metric black hole and the principle of least resistance: why corporate cultures drift toward shallow communication and busyness.'],
            ['Deep Work Is Meaningful', 'The neurological, psychological, and philosophical arguments for depth: crafting a craftsman\'s lifestyle in knowledge work.'],
            ['Rule #1: Work Deeply', 'Choosing your depth philosophy: monastic, bimodal, rhythmic, or journalistic scheduling. Rituals, shutdowns, and execution.'],
            ['Rule #2: Embrace Boredom', 'Rewiring your brain for focus: productive meditation, interval training for attention, and resisting the urge for quick distraction.'],
            ['Rule #3: Quit Social Media', 'The craftsman approach to tool selection: adopt a tool only if its positive impacts substantially outweigh its negative consequences.'],
            ['Rule #4: Drain the Shallows', 'Schedule every minute of your day, quantify the depth of every activity, finish work by 5:30, and become hard to reach.'],
            ['The Deep Life Philosophy', 'Reflections on living a life focused on craftsmanship, deep impact, and meaningful creative contributions.'],
        ];

        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $bookDef['title'],
            'author' => $bookDef['author'],
            'total_chapters' => count($curriculum),
            'estimated_reading_minutes' => 320,
            'chapters' => array_map(function ($idx, $item) use ($bookDef) {
                $num = $idx + 1;
                return [
                    'number' => $num,
                    'title' => "Chapter {$num}: {$item[0]}",
                    'subtitle' => $item[1],
                    'content' => "### Fundamental Principle\n{$item[1]}\n\nCal Newport defines Deep Work as: Professional activities performed in a state of distraction-free concentration that push your cognitive capabilities to their limit. These efforts create new value, improve your skill, and are hard to replicate.\n\n### The Deep Work Equation\n• High-Quality Work Produced = (Time Spent) × (Intensity of Focus)\n• Attention Residue: When you switch from task A to task B, your attention does not immediately follow. A residue of your attention remains stuck thinking about the previous task.\n• Deliberate Practice: Demands uninterrupted concentration. Rapid feedback mechanisms accelerate mastery only when the mind is singularly engaged.",
                ];
            }, array_keys($curriculum), $curriculum),
        ];
    }

    protected function getBriefHistoryOfTimeContent(array $bookDef): array
    {
        $curriculum = [
            ['Our Picture of the Universe', 'From Aristotle\'s geocentric spheres and Ptolemy to Copernicus, Kepler, Galileo, and Newton\'s gravitational synthesis.'],
            ['Space and Time', 'Einstein\'s special and general relativity: the demise of absolute time and space, light cones, and spacetime curvature.'],
            ['The Expanding Universe', 'Hubble\'s discovery of galactic redshift, Doppler shifts, the Big Bang theory, and the cosmic microwave background.'],
            ['The Uncertainty Principle', 'Quantum mechanics, Heisenberg\'s uncertainty relations, wave-particle duality, and Planck\'s constant.'],
            ['Elementary Particles and the Forces of Nature', 'Quarks, leptons, gauge bosons, and the four fundamental forces: gravity, electromagnetism, weak, and strong interactions.'],
            ['Black Holes: Singularities and Event Horizons', 'Gravitational collapse of massive stars, Chandrasekhar limit, event horizons, and non-radiating astronomical bodies.'],
            ['Black Holes Ain\'t So Black: Hawking Radiation', 'Quantum particle-antiparticle creation near the event horizon: virtual particles, negative energy, and black hole evaporation.'],
            ['The Origin and Fate of the Universe', 'The no-boundary proposal with James Hartle, imaginary time, cosmic inflation, and the initial singularity.'],
            ['The Arrow of Time', 'Thermodynamic arrow of time (entropy increase), psychological arrow of time, and cosmological arrow of cosmic expansion.'],
            ['The Unification of Physics', 'Superstring theory, quantum gravity, supersymmetry, and the ultimate quest for a complete Theory of Everything.'],
        ];

        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $bookDef['title'],
            'author' => $bookDef['author'],
            'total_chapters' => count($curriculum),
            'estimated_reading_minutes' => 400,
            'chapters' => array_map(function ($idx, $item) use ($bookDef) {
                $num = $idx + 1;
                return [
                    'number' => $num,
                    'title' => "Chapter {$num}: {$item[0]}",
                    'subtitle' => $item[1],
                    'content' => "### Theoretical Cosmology\n{$item[1]}\n\nIn this seminal work by Stephen Hawking, theoretical physics is explained without relying on mathematical formalism. As Hawking noted, someone told him that each equation he included in the book would halve the sales, so he resolved not to have any equations at all—except for Einstein\'s famous equation, E = mc².\n\n### Core Insights\n• General Relativity and Quantum Mechanics: General Relativity governs the very large (stars, galaxies, spacetime curvature), while Quantum Mechanics governs the subatomic scale. A unified quantum theory of gravity is required to understand the beginning of the universe.\n• Hawking Radiation: Quantum fluctuations allow black holes to emit thermal radiation and eventually evaporate over cosmic timescales.\n• The Arrow of Time: Disorder increases with time because there are vastly more disordered states than ordered ones (Second Law of Thermodynamics).",
                ];
            }, array_keys($curriculum), $curriculum),
        ];
    }

    protected function getRichCuratedCurriculum(array $bookDef): array
    {
        $title = $bookDef['title'];
        $author = $bookDef['author'];
        $genre = $bookDef['genre'];

        $chapters = [
            ['Exposition and Historical Background', "Setting the social, cultural, and ideological canvas of {$title}."],
            ['Foundational Themes and Core Arguments', "An analysis of the central thesis and principal characters or theories."],
            ['Complications, Conflict, and Inquiry', "The development of tension, counter-arguments, and turning points."],
            ['Climax, Culmination, and Clashing Ideas', "The critical inflection point where pivotal discoveries and decisions unfold."],
            ['Resolution, Synthesis, and Aftermath', "The harmonious resolution of thematic conflicts and lasting theoretical outcomes."],
            ['Enduring Legacy and Modern Perspectives', "Why {$title} continues to influence contemporary literature and thought."],
        ];

        return [
            'type' => 'chapters',
            'version' => '2.0',
            'book_title' => $title,
            'author' => $author,
            'total_chapters' => count($chapters),
            'estimated_reading_minutes' => 240,
            'chapters' => array_map(function ($idx, $item) use ($title, $author, $genre) {
                $num = $idx + 1;
                return [
                    'number' => $num,
                    'title' => "Chapter {$num}: {$item[0]}",
                    'subtitle' => $item[1],
                    'content' => "### {$item[0]}\n{$item[1]}\n\n{$title} stands as a premier achievement within the {$genre} genre. Penned by {$author}, the narrative examines enduring human questions: our moral responsibilities, societal obligations, and the psychological realities of existence.\n\n### Analytical Perspectives\nThrough careful construction and evocative prose, the text explores key themes that have shaped critical thought across generations. Readers witness how early philosophical premises directly inform character motivations and narrative stakes.\n\n### Enduring Relevance\nCenturies after its original publication, {$title} continues to be studied in universities and enjoyed by readers worldwide, illustrating the universal appeal of thoughtful storytelling and disciplined inquiry.",
                ];
            }, array_keys($chapters), $chapters),
        ];
    }
}
