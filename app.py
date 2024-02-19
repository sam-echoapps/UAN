from flaskr.app import app,g,config
from flask_cors import CORS 
#import dns
import os
#from dns import *
#from eventlet import hubs
import gunicorn.app.base
import gunicorn.workers.gthread
#hubs.use_hub("epolls")

def number_of_workers():
    return (1)
class StandaloneApplication(gunicorn.app.base.BaseApplication):
    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def load_config(self):
        config = {key: value for key, value in self.options.items()
                  if key in self.cfg.settings and value is not None}
        for key, value in config.items():
            self.cfg.set(key.lower(), value)

    def load(self):
        return self.application

if __name__ == '__main__':
    oneplace_home = config.get('ONEPLACE_CONFIG','HOME_DIR') 
    server_port = config.get('ONEPLACE_CONFIG','SERVER_PORT')
    options = {
        'worker_class': 'gthread', 
        'bind': '%s:%s' % ('0.0.0.0',server_port),
        'workers': number_of_workers(),
        'threads': 3,
        'pidfile' : os.path.join(oneplace_home,'oneplace.pid'),
        'default_proc_name' : 'OnePAgent',
        'timeout' : 1200000
    }
    StandaloneApplication(app, options).run()

