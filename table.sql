CREATE TABLE IF NOT EXISTS organizations (
    id serial primary key,
    name varchar(255) not null,
);

CREATE TABLE IF NOT EXISTS members (
    id serial primary key,
    organization_id bigint not null,
    employee_id varchar(255) not null,
    email varchar(255) not null,
    first_name varchar(255) not null,
    middle_name varchar(255),
    last_name varchar(255) not null,
    date_of_birth varchar(255) not null,
    gender varchar(10) not null,
    CONSTRAINT fk_member FOREIGN KEY(organization_id) REFERENCES organizations(id)
    UNIQUE (organization_id , employee_id)
)


INSERT INTO organizations(name) VALUES ('Test');
INSERT INTO organizations(name) VALUES ('Test2');
INSERT INTO organizations(name) VALUES ('Test3');
INSERT INTO  organizations(name) VALUES ('Testr5');

INSERT INTO members(organization_id, employee_id, email, first_name, middle_name, last_name, date_of_birth, gender)
    VALUES(1, 123, 'test@gmail.com', 'test', null, 'test', '12/12/1999' ,'Male')
