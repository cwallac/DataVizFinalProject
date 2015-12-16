import csv, sqlite3

con = sqlite3.connect("mbta.db")
cur = con.cursor()
cur.execute("CREATE TABLE mbta (station, datetime, entries, exits);")

with open('StationCountsByMinute_2014_02-01--03-02.csv','rb') as fin: # `with` statement available in 2.5+
    # csv.DictReader uses first line in file for column headings by default
    dr = csv.DictReader(fin) # comma is default delimiter
    to_db = [(i['station'], i['datetime'], i['entries'], i['exits']) for i in dr]

cur.executemany("INSERT INTO mbta (station, datetime, entries, exits) VALUES (?, ?, ?, ?);", to_db)
con.commit()
