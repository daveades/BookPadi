# BookPadi Architecture 
An explanation or walkthrough of how I came about the data model for bookpadi's MVP

## User Flow
For the MVP, I wanted the application to simply provide a searchable library of openly licensed books, which meant that the backend would need to support the following four operations at minimum:

1. Browse available books
2. Search for books
3. View the details of a selected book
4. Reading a book

## Data requirements
The next step was to trace the operations to see what data each operation required.

1. **Broswing and Searching**: The backend needs data that can be queried and filtered.
2. **Details page**: Needs more information about the selected book
3. **Reading a book**: The actual book file

I then decided it was best to store only information that describes a book in the DB and store the actual files separately.

## Categories of Data
I listed out all possible data that might be needed and grouped them into three categories

### PostgreSQL
All the information the apps will need to sucessfully query, filter, search and display books

1. Book title
2. Description
3. Publication information: Publication year, Publisher, Edition
4. Author
5. Topic
6. License
7. Formats available to read
8. Location of books
9. Location of cover images

### Book files
The actual book files. Only the location to these files are stored in PostgreSQL

### Cover Images

The Image files are stored separately. Only the location where each images is stored is stored in PostgreSQL

## Structuring the Data in PostgreSQL

After I established the data requirements, the next thing I had to figure out was how to organise that information in PostgreSQL.
I started with how I will organise the data that a book in postgres, since it is the central entity the MVP is built around.

### Book

Primary entity of the system.

Its initial attributes are:
- id
- title
- description
- publication year
- publsher
- edition
- cover reference

### Author 

I modeled an author as a separate entity because an author is a distinct piece of data that can be associated with multiple books and a book can have multiple authors

described by:
- id
- name

### Topic
A topic is the subject area that a book can belong to.

contains:
- id 
- name

many-to-many relationship with books.


### License
Represents the license under which a book is made available.

- id
- name
- license_url

### Format
Represents the available formats of a book

- id
- name

### location
- where the book can be accessed

The location is associated with the book-format relationship rather than with the book directly because the availability can depend on the specific format.

## Defining the relationships
I defined the relationship between the entities by asking two questions:
1. For one record fo this entity, what is the minimum number of records of the other entity it must be associated with? to determin whether relationship is optional
2. For one record fo this entity, what is the maximum number of records of the other entity it can be associated with? to determine it is one or many.

![BookPadi ER Diagram](./attachments/ERdiagram.svg)

</br>

[Read More](./attachments/Walktrough%20BookPadi%20MVP%20Architecture.pdf)


