<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Category;
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
        // 1. Create default Categories
        $softwareCat = Category::firstOrCreate(['name' => 'Software'], ['description' => 'Software engineering, design patterns, and programming methodology books']);
        $techCat = Category::firstOrCreate(['name' => 'Technology'], ['description' => 'General computer technology, database systems, and networking']);
        $fictionCat = Category::firstOrCreate(['name' => 'Fiction'], ['description' => 'Literature, storytelling, and classic novels']);
        $scienceCat = Category::firstOrCreate(['name' => 'Science'], ['description' => 'Physics, chemistry, biology, and habit psychology science']);

        // 2. Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@library.org'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ]
        );

        // 3. Librarian User
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

        // 4. Member User (approved student)
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
                'department' => 'Computer Science',
                'programme' => 'BSc Computer Science',
                'interests' => 'Software, Tech, Algorithms',
                'is_approved' => true,
                'membership_fee_paid' => true,
                'borrow_limit' => 5,
                'is_banned' => false,
            ]
        );

        // 5. Unapproved Member User (needs approval & fee payment)
        $pendingUser = User::firstOrCreate(
            ['email' => 'pending@library.org'],
            [
                'name' => 'Jane Doe',
                'password' => Hash::make('password123'),
                'role' => 'member',
            ]
        );

        Member::firstOrCreate(
            ['user_id' => $pendingUser->id],
            [
                'member_number' => 'MEM-PENDING',
                'membership_tier' => 'student',
                'department' => 'Mechanical Engineering',
                'programme' => 'BSc Mechanical Engineering',
                'interests' => 'Science, Physics',
                'is_approved' => false,
                'membership_fee_paid' => false,
                'borrow_limit' => 3,
                'is_banned' => false,
            ]
        );

        // 6. Sample Books Data
        $booksData = [
            [
                'isbn' => '978-0132350884',
                'title' => 'Clean Code: A Handbook of Agile Software Craftsmanship',
                'author' => 'Robert C. Martin',
                'publisher' => 'Prentice Hall',
                'genre' => 'Software',
                'description' => 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
                'publication_year' => 2008,
                'total_copies' => 4,
                'available_copies' => 3,
                'category_id' => $softwareCat->id,
            ],
            [
                'isbn' => '978-0201616224',
                'title' => 'The Pragmatic Programmer: Your Journey To Mastery',
                'author' => 'Andrew Hunt & David Thomas',
                'publisher' => 'Addison-Wesley',
                'genre' => 'Software',
                'description' => 'One of the most significant books in software development for pragmatic career growth and engineering practices.',
                'publication_year' => 1999,
                'total_copies' => 3,
                'available_copies' => 2,
                'category_id' => $softwareCat->id,
            ],
            [
                'isbn' => '978-1449373320',
                'title' => 'Designing Data-Intensive Applications',
                'author' => 'Martin Kleppmann',
                'publisher' => 'O\'Reilly Media',
                'genre' => 'Tech',
                'description' => 'The definitive guide to data architecture, distributed systems, consistency models, and transaction isolation.',
                'publication_year' => 2017,
                'total_copies' => 5,
                'available_copies' => 5,
                'category_id' => $techCat->id,
            ],
            [
                'isbn' => '978-0743273565',
                'title' => 'The Great Gatsby',
                'author' => 'F. Scott Fitzgerald',
                'publisher' => 'Scribner',
                'genre' => 'Fiction',
                'description' => 'A tragic story of Jay Gatsby, a self-made millionaire, and his pursuit of Daisy Buchanan in 1920s America.',
                'publication_year' => 1925,
                'total_copies' => 3,
                'available_copies' => 3,
                'category_id' => $fictionCat->id,
            ],
            [
                'isbn' => '978-0735211292',
                'title' => 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
                'author' => 'James Clear',
                'publisher' => 'Avery',
                'genre' => 'Science',
                'description' => 'Tiny changes, remarkable results. Learn how small 1% daily improvements stack up over time into massive growth.',
                'publication_year' => 2018,
                'total_copies' => 4,
                'available_copies' => 4,
                'category_id' => $scienceCat->id,
            ],
        ];

        foreach ($booksData as $bData) {
            $book = Book::firstOrCreate(
                ['isbn' => $bData['isbn']],
                $bData
            );

            // Create book copies if none exist
            if ($book->copies()->count() === 0) {
                for ($i = 1; $i <= $book->total_copies; $i++) {
                    $copy = BookCopy::create([
                        'book_id' => $book->id,
                        'barcode' => 'BC-' . str_replace('-', '', $book->isbn) . '-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                        'condition' => 'good',
                        'status' => ($i === 1 && $book->id === 1) ? 'checked_out' : 'available',
                        'location_rack' => 'Rack-' . rand(1, 10),
                    ]);

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
    }
}
