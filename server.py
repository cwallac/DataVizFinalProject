#
# A simple server for mbta 
#
# Requires the bottle framework
# (sufficient to have bottle.py in the same folder)
#
# run with:
#
#    python server.py 8000
#
# You can use any legal port number instead of 8000
# of course
#


from bottle import get, post, run, request, static_file, redirect
import os
import sys
import sqlite3

import traceback

from bottle import response
from json import dumps


MORTALITYDB = "mbta.db"

# SELECT station, SUM(entries), SUM(exits) FROM station 
# WHERE datetime > "2014-02-01 04:32:00" AND datetime < "2014-02-01 05:41:00" GROUP BY station;

def pullData ():
    conn = sqlite3.connect(MORTALITYDB)
    cur = conn.cursor()

    try: 
        cur.execute("""SELECT station, SUM(entries) as sumEntries, SUM(exits) as sumExits
                       FROM mbta
                       WHERE datetime >= '2014-02-01 04:32:00'
                        AND datetime <= '2014-02-01 05:41:00' GROUP by station""")
        
        data = [{"station": station,
                 "sumEntries":int(sumEntries),
                 "sumExits": int(sumExits)
                 } for (station, sumEntries, sumExits,) in  cur.fetchall()]
        conn.close()

        print data

        return {"data":data}

    except: 
        print "ERROR!!!"
        conn.close()
        raise
  
       
@get('/data')
def data ():
    return pullData()

@post('/data')
def data():
    start = request.forms.get('start')
    end = request.forms.get('end')


@get('/<name>')
def static (name="project4.html"):
    return static_file(name, root='.')

def main (p):
    run(host='0.0.0.0', port=p)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(int(sys.argv[1]))
    else:
        print "Usage: server <port>"