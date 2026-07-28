<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Librarian;
use App\Models\Loan;
use App\Models\Member;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@library.org'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ]
        );

        // 2. Librarian User
        $librarianUser = User::firstOrCreate(
            ['email' => 'librarian@library.org'],
            [
                'name' => 'Head Librarian',
                'password' => Hash::make('password123'),
                'role' => 'librarian',
            ]
        );

        Librarian::firstOrCreate(
            ['user_id' => $librarianUser->id],
            [
                'employee_id' => 'LIB-1002',
                'department' => 'Circulation & OPAC Services',
            ]
        );

        // 3. Member User
        $memberUser = User::firstOrCreate(
            ['email' => 'member@library.org'],
            [
                'name' => 'Alex Johnson',
                'password' => Hash::make('password123'),
                'role' => 'member',
            ]
        );

        $member = Member::firstOrCreate(
            ['user_id' => $memberUser->id],
            [
                'member_number' => 'MEM-2026',
                'membership_tier' => 'student',
                'borrow_limit' => 5,
                'is_banned' => false,
                'is_subscribed' => true,
            ]
        );

        // 4. Sample 5 Books
        $booksData = [
            [
                'isbn' => '978-0132350884',
                'title' => 'Clean Code: A Handbook of Agile Software Craftsmanship',
                'author' => 'Robert C. Martin',
                'publisher' => 'Prentice Hall',
                'genre' => 'Software',
                'description' => 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 2008,
                'total_copies' => 4,
                'available_copies' => 3,
                'is_exclusive' => false,
                'digital_purchase_price' => 50.00,
            ],
            [
                'isbn' => '978-0201616224',
                'title' => 'The Pragmatic Programmer: Your Journey To Mastery',
                'author' => 'Andrew Hunt & David Thomas',
                'publisher' => 'Addison-Wesley',
                'genre' => 'Software',
                'description' => 'One of the most significant books in software development for pragmatic career growth and engineering practices.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1999,
                'total_copies' => 3,
                'available_copies' => 2,
                'is_exclusive' => true,
                'digital_purchase_price' => 60.00,
            ],
            [
                'isbn' => '978-1449373320',
                'title' => 'Designing Data-Intensive Applications',
                'author' => 'Martin Kleppmann',
                'publisher' => 'O\'Reilly Media',
                'genre' => 'Tech',
                'description' => 'The definitive guide to data architecture, distributed systems, consistency models, and transaction isolation.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 2017,
                'total_copies' => 5,
                'available_copies' => 5,
                'is_exclusive' => true,
                'digital_purchase_price' => 75.00,
            ],
            [
                'isbn' => '978-0743273565',
                'title' => 'The Great Gatsby',
                'author' => 'F. Scott Fitzgerald',
                'publisher' => 'Scribner',
                'genre' => 'Fiction',
                'description' => 'A tragic story of Jay Gatsby, a self-made millionaire, and his pursuit of Daisy Buchanan in 1920s America.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 1925,
                'total_copies' => 3,
                'available_copies' => 3,
                'is_exclusive' => false,
                'digital_purchase_price' => 30.00,
            ],
            [
                'isbn' => '978-0735211292',
                'title' => 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
                'author' => 'James Clear',
                'publisher' => 'Avery',
                'genre' => 'Science',
                'description' => 'Tiny changes, remarkable results. Learn how small 1% daily improvements stack up over time into massive growth.',
                'cover_image_path' => 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600',
                'publication_year' => 2018,
                'total_copies' => 4,
                'available_copies' => 4,
                'is_exclusive' => false,
                'digital_purchase_price' => 45.00,
            ],
        ];

        foreach ($booksData as $bData) {
            $bData['file_path'] = $this->generateSamplePdfBase64(
                $bData['title'],
                $bData['author'],
                $bData['genre'],
                $bData['description']
            );

            $book = Book::updateOrCreate(
                ['isbn' => $bData['isbn']],
                $bData
            );

            // Seed generic book copy barcodes
            for ($i = 1; $i <= $book->total_copies; $i++) {
                $cleanIsbn = str_replace('-', '', $book->isbn);
                $barcode = 'BC-' . $cleanIsbn . '-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT);

                $copy = BookCopy::firstOrCreate(
                    ['barcode' => $barcode],
                    [
                        'book_id' => $book->id,
                        'condition' => 'good',
                        'status' => ($i === 1 && $book->id === 1) ? 'checked_out' : 'available',
                        'location_rack' => 'Rack-' . (($book->id + $i) % 10 + 1),
                    ]
                );

                if ($i === 1 && $book->id === 1) {
                    Loan::firstOrCreate(
                        ['book_copy_id' => $copy->id, 'member_id' => $member->id],
                        [
                            'loan_date' => now()->subDays(10),
                            'due_date' => now()->addDays(4),
                            'status' => 'active',
                            'renewal_count' => 0,
                        ]
                    );
                }
            }
        }
    }

    private function generateSamplePdfBase64(string $title, string $author, string $genre, string $description): string
    {
        $cleanTitle = preg_replace('/[^\x20-\x7E]/', '', $title);
        $cleanAuthor = preg_replace('/[^\x20-\x7E]/', '', $author);
        $cleanGenre = preg_replace('/[^\x20-\x7E]/', '', $genre);
        $cleanDescription = preg_replace('/[^\x20-\x7E]/', '', $description);

        $streamContent = "BT\n" .
            "/F1 18 Tf\n" .
            "50 740 Td\n" .
            "(" . addcslashes($cleanTitle, '()\\') . ") Tj\n" .
            "/F1 12 Tf\n" .
            "0 -30 Td\n" .
            "(Author: " . addcslashes($cleanAuthor, '()\\') . ") Tj\n" .
            "0 -20 Td\n" .
            "(Genre: " . addcslashes($cleanGenre, '()\\') . ") Tj\n" .
            "/F1 10 Tf\n" .
            "0 -30 Td\n" .
            "(Overview:) Tj\n" .
            "0 -15 Td\n" .
            "(" . addcslashes($cleanDescription, '()\\') . ") Tj\n" .
            "0 -35 Td\n" .
            "(CHAPTER 1: INTRODUCTION & OVERVIEW) Tj\n" .
            "0 -20 Td\n" .
            "(Welcome to the digital edition of " . addcslashes($cleanTitle, '()\\') . ".) Tj\n" .
            "0 -18 Td\n" .
            "(This document is authorized for digital access via Smart Library Management System.) Tj\n" .
            "0 -18 Td\n" .
            "(All rights reserved.) Tj\n" .
            "ET";

        $streamLen = strlen($streamContent);

        $pdf = "%PDF-1.4\n" .
            "1 0 obj\n" .
            "<< /Type /Catalog /Pages 2 0 R >>\n" .
            "endobj\n" .
            "2 0 obj\n" .
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n" .
            "endobj\n" .
            "3 0 obj\n" .
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\n" .
            "endobj\n" .
            "4 0 obj\n" .
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n" .
            "endobj\n" .
            "5 0 obj\n" .
            "<< /Length " . $streamLen . " >>\n" .
            "stream\n" .
            $streamContent . "\n" .
            "endstream\n" .
            "endobj\n" .
            "xref\n" .
            "0 6\n" .
            "0000000000 65535 f \n" .
            "0000000009 00000 n \n" .
            "0000000058 00000 n \n" .
            "0000000115 00000 n \n" .
            "0000000244 00000 n \n" .
            "0000000315 00000 n \n" .
            "trailer\n" .
            "<< /Size 6 /Root 1 0 R >>\n" .
            "startxref\n" .
            (370 + $streamLen) . "\n" .
            "%%EOF";

        return 'data:application/pdf;base64,' . base64_encode($pdf);
    }
}
