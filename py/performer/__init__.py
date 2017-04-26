import pstats
import cProfile
import json
import requests


def jsonify(nodes: dict):
    if len(nodes.keys()) == 0:
        return nodes
    else:
        nodes_new = {}
        for key, val in nodes.items():
            data = {
                'file': key[0],
                'line': key[1],
                'func': key[2],
                'calls': val[0],
                'self': val[2],
                'total': val[3],
            }

            if len(val) == 5:
                data['callers'] = jsonify(val[4])

            nodes_new[str(key)] = data
        return nodes_new


class Performer:
    def __enter__(self):
        self.pr = cProfile.Profile()
        self.pr.enable()

    def __exit__(self, exc_type, exc_value, traceback):
        self.pr.disable()
        if not exc_type:
            ps = pstats.Stats(self.pr)
            js = json.dumps(jsonify(ps.stats), indent=4)
            requests.post('http://localhost:19876', data=js)

        self.pr = None


