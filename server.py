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


MBTADB = "mbta.db"

def pullData (start, end):
    print start
    print end
    conn = sqlite3.connect(MBTADB)
    cur = conn.cursor()

# (
#                             SELECT station, SUM(entries) as sumEntries, SUM(exits) as sumExits, 
#                             FROM mbta
#                             WHERE datetime >= ?
#                             AND datetime <= ? 
#                             GROUP by station
#                         )
    try: 
        cur.execute("""SELECT station, SUM(entries), SUM(exits)
                       FROM mbta
                       WHERE datetime >= ?
                        AND datetime <= ? 
                        GROUP by station""", (start, end))
        
        data = [{"station": station,
                 "sumEntries":int(sumEntries),
                 "sumExits": int(sumExits)
                 } for (station, sumEntries, sumExits,) in  cur.fetchall()]
        conn.close()

        maxEntry = max(set([r["sumEntries"] for r in data]))
        maxExit = max(set([r["sumExits"] for r in data]))    

        return {"data":data,
                "maxEntry": maxEntry,
                "maxExit": maxExit
                }

    except: 
        print "ERROR!!!"
        conn.close()
        raise
  

@post('/data')
def data():
    start = request.json.get("start")
    end = request.json.get("end")
    return pullData(start, end)

@get('/data/rawCoordinates.json')
def raw():
    return static_file("data/rawCoordinates.json", root='.')    

@get('/data/stationPaths.json')
def station():
    return static_file("data/stationPaths.json", root='.')    

@get('/data/turnstile-gtfs-mapping.json')
def turnstile():
    return static_file("data/turnstile-gtfs-mapping.json", root='.')    

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