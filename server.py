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

def pullData (start, end):
    print start
    print end
    conn = sqlite3.connect(MORTALITYDB)
    cur = conn.cursor()

    try: 
        cur.execute("""SELECT station, SUM(entries) as sumEntries, SUM(exits) as sumExits
                       FROM mbta
                       WHERE datetime >= ?
                        AND datetime <= ? 
                        GROUP by station""", (start, end))
        
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
  

@post('/data')
def data():
    start = request.json.get("start")
    end = request.json.get("end")
    return pullData(start, end)


@get('/<name>')
def static (name="index.html"):
    return static_file(name, root='.')

def main (p):
    run(host='0.0.0.0', port=p)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(int(sys.argv[1]))
    else:
        print "Usage: server <port>"