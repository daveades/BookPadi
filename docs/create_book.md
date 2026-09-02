# CreateBook

An explanation or walkthrough of how I came about the logic for adding a book to bookpadi

## The operation

CreateBook performs all database changes required to be able to create a new book entry in BookPad in just a single PostgreSQL transaction so that if any step fails, PostgreSQL can roll back all the changes made during the operation. This allows CreateBook to treat the creation of the book row, authors, topics and formats as one as if it were one operation.

Adding a book is a little more than just inserting a row into the database. A book with a record in postgres that has no corresponding file object can't be accessed and vice versa. The operation is only going to be complete when both the postgres store (book metdata) and the file store (actual files) are succesful. If there are issues when trying to insert book metadata (PostgreSQL) it's possible to rollback the chnages but for file storage it's not as straightfoward and you can see the effects of this [here](#ordering-the-two-stores) and why it is the better option.

## Data requirements

The operation to add books does not need me to define new sets of requirements. Whatever the reads operations needs, adding a book simply has to supply it.

Tracing back through the four operations:

1. **Browse** uses title, authors and cover
2. **Search** matches on title, description, author and topic
3. **Details** uses title, description, language, publication information, cover, authors, topics, license and the available formats
4. **Reading** uses the location of one book in one format

## Categories of input

I then grouped the inputs by how each one of them is handled when adding a book because the operations are slightly different.

### The book's attributes

These are in the books table and don't need anything special for them to be added into the db

`Title, description, language, publication year, publisher, edition.`

### Shared entities

Authors, topics and the license. These entities are not owned by `book`, A single author can be the author of several other books and the same topic might be covered in many books so adding a book must reuse an existing row or create a new one if it is not existing in the affected table.

To check if an author, topic or license already exists, I need to ignore the difference in uppercase and lowercase letters. For example, `Fiction` and `fiction` should be treated as the same topic.

The unique indexes use `lower(name)` to enforce this so the lookup needs to work the same way, if not, a search for `fiction` would not find an existing `Fiction` row. CreateBook would then try to create `fiction`, and PostgreSQL would reject it because `Fiction` already exists.

### A closed vocabulary

For formats, Unlike authors and topics, the set of formats is fixed and manually written and updated. Adding a book checks the supplied format against the formats table and fails if the format supplied is unknown
### References to things outside the database

The cover reference and the location of each file are stored in postgresql. The book and images are stored in a file storage (as decided in [architecture.md](./architecture.md))

## Ordering the two stores

Since only PostgreSQL can be easily rolled back, one of the two stores might end up containing information/data the other does not know anything about when a failure happens. The challenge here is to make sure the two are in sync and failure on either end is handled gracefully.

| Order | What happens on failure |
| --- | --- |
| Row first, then upload | A book in the catalog with no file behind it |
| Upload first, then row | A file in storage that nothing points at |

I chose to upload first. A file that has no reference will be invisible to readers and will costs only addtional storage. The orphaned file can then be found later by comparing file storage with the locations in `book_format` but a book that cannot be reached by the user but displayed is worse

It also means the book row will only exist after its files have been uploaded so i'll not be needing an extra state to record whether a book has been uploaded or not.

## What CreateBook does not do

CreateBook does no file work and makes no network calls. The files are uploaded before it runs and their locations are passed to it as ordinary data.

This is what keeps the transaction honest. Everything inside the transaction is database work, and database work can be undone. An upload inside a transaction would be a block that only half rolls back, which is worse than having no block at all.

It also knows nothing about where the book came from. It receives a book that has already been put into bookpadi's shape, so adding a second source later does not change it.

## Rules the database cannot enforce

A book must have at least one author, at least one topic and at least one format and none of these constraints can be expressed with foreign key references

A foreign key relationship makes sure that a child points at an already existing parent. For example: `book_author.book_id` ensures that there is a book entry for every book referenced by `book_id` but what I need is the reverse, a book has to have at least one thing (author, topic and format) pointing at it and I cannot use foreign keys to express that.

I considered PostgreSQL's deferred constraint triggers which would work but would put the rules at the database level. I wanted to keep the rules at the application level for now because this project is also a way for me to learn, so I enforced them in CreateBook instead.

That gives me two separate guarantees:
- Validation makes sure the book has at least one author, topic and format before the database is updated.
- The transaction makes sure that if something fails while creating the book, the database changes are rolled back.

Validation alone would still allow a book with three out of its seven topics to get written. The transaction alone would happily commit a book with no authors, because nothing would fail.

## Order of operations

1. Validate that authors, topics and formats are all present
2. Insert the `books` row and return the id
3. For each author, reuse or create then create the references
4. For each topic, reuse or create, then create the references
5. For each format, look it up, then create the references
