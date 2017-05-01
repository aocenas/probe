import sys
import json
import requests
import timeit
from pprint import pprint
from .naming import get_name


class Performer:
    def __init__(self):
        self.root = {
            'children': [],
            'start': timeit.default_timer(),
        }
        self.stack = [self.root]

    def __enter__(self):
        # self.pr = cProfile.Profile()
        # self.pr.enable()
        sys.setprofile(self._profile)

    def __exit__(self, exc_type, exc_value, traceback):
        sys.setprofile(None)
        self.root['end'] = timeit.default_timer()
        # last one is our own __exit__ func
        self.root['children'].pop()
        # self.pr.disable()
        if not exc_type:
            # ps = pstats.Stats(self.pr)
            # print(ps.stats)
            js = json.dumps(self.root, indent=4)
            requests.post('http://localhost:19876', data=js)
        #
        # self.pr = None
        pprint(self.root)

    def _profile(self, frame, event, arg):
        if event in ['call', 'c_call']:
            current = self.stack.pop()
            child = {
                'func': get_name(event, frame, arg),
                'line': frame.f_code.co_firstlineno,
                'file': frame.f_code.co_filename,
                'children': [],
                'start': timeit.default_timer(),
            }
            current['children'].append(child)
            self.stack.append(current)
            self.stack.append(child)

        if event in ['return', 'c_return']:
            if len(self.stack) > 1:
                current = self.stack.pop()
                current['end'] = timeit.default_timer()
                current['total'] = current['end'] - current['start']
                current['self'] = current['total'] - sum([child['total'] for child in current['children']])


