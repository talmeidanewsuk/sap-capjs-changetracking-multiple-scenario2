const cds = require('@sap/cds')

async function _createIncidents(Incidents, srv, entries) {
  //return await srv.run(INSERT.into(Incidents).rows(entries));
  return await srv.run(INSERT.into(Incidents).entries(entries));
}

async function createSingle() {
  const srv = await cds.connect.to("ProcessorService");
  const Incidents = srv.entities["Incidents"];
  
  return _createIncidents(Incidents, srv, {
    title: 'test object'
  });

}

async function createMultiple1() {
  const srv = await cds.connect.to("ProcessorService");
  const Incidents = srv.entities["Incidents"];
  

  // error: 
  // Error: Property "0" does not exist in ProcessorService.Incidents
  //   at Validation.unknown (/home/user/projects/incidents-app/node_modules/@sap/cds/lib/req/validate.js:52:23)
  //   at entity.validate (/home/user/projects/incidents-app/node_modules/@sap/cds/lib/req/validate.js:208:65)
  //   at entity.validate (/home/user/projects/incidents-app/node_modules/@sap/cds/lib/req/validate.js:232:44)
  //   at cds.validate (/home/user/projects/incidents-app/node_modules/@sap/cds/lib/req/validate.js:9:10)
  //   at ProcessorService.commonGenericInput (/home/user/projects/incidents-app/node_modules/@sap/cds/libx/_runtime/common/generic/input.js:265:22)
  //   at ProcessorService.handle (/home/user/projects/incidents-app/node_modules/@sap/cds/lib/srv/srv-dispatch.js:52:53)
  //   at process.processTicksAndRejections (/home/user/projects/incidents-app/lib/internal/process/task_queues.js:95:5)
  //   at async ProcessorService.handle (/home/user/projects/incidents-app/node_modules/@sap/cds/libx/_runtime/common/Service.js:80:16)
  //   at async cds.ApplicationService.handle (/home/user/projects/incidents-app/node_modules/@sap/cds/libx/_runtime/fiori/lean-draft.js:494:5)
  //   at async ProcessorService.createMultiple1 (/home/user/projects/incidents-app/srv/services.js:22:10) {status: 400, stack: 'Error: Property "0" does not exist in Process…projects/incidents-app/srv/services.js:22:10)', message: 'Property "0" does not exist in ProcessorService.Incidents'}
  return await srv.run(INSERT.into(Incidents).entries([
    {
      title: 'test object1'
    },
    {
      title: 'test object2'
    }
  ]));
}


async function createMultiple2() {
  const srv = await cds.connect.to("ProcessorService");
  const Incidents = srv.entities["Incidents"];
  

  // error: 
  // Error: Property "0" does not exist in ProcessorService.Incidents
  //   at Validation.unknown (/home/user/projects/incidents-app/node_modules/@sap/cds/lib/req/validate.js:52:23)
  //   at entity.validate (/home/user/projects/incidents-app/node_modules/@sap/cds/lib/req/validate.js:208:65)
  //   at entity.validate (/home/user/projects/incidents-app/node_modules/@sap/cds/lib/req/validate.js:232:44)
  //   at cds.validate (/home/user/projects/incidents-app/node_modules/@sap/cds/lib/req/validate.js:9:10)
  //   at ProcessorService.commonGenericInput (/home/user/projects/incidents-app/node_modules/@sap/cds/libx/_runtime/common/generic/input.js:265:22)
  //   at ProcessorService.handle (/home/user/projects/incidents-app/node_modules/@sap/cds/lib/srv/srv-dispatch.js:52:53)
  //   at process.processTicksAndRejections (/home/user/projects/incidents-app/lib/internal/process/task_queues.js:95:5)
  //   at async ProcessorService.handle (/home/user/projects/incidents-app/node_modules/@sap/cds/libx/_runtime/common/Service.js:80:16)
  //   at async cds.ApplicationService.handle (/home/user/projects/incidents-app/node_modules/@sap/cds/libx/_runtime/fiori/lean-draft.js:494:5)
  //   at async ProcessorService.createMultiple1 (/home/user/projects/incidents-app/srv/services.js:22:10) {status: 400, stack: 'Error: Property "0" does not exist in Process…projects/incidents-app/srv/services.js:22:10)', message: 'Property "0" does not exist in ProcessorService.Incidents'}
  return await srv.run(INSERT.into(Incidents).rows([
    {
      title: 'test object1'
    },
    {
      title: 'test object2'
    }
  ]));
}

/**
 * This method of inserting multiple works correctly and tracks change log but it is slow.
 * @returns 
 */
async function createMultiple3() {
  const srv = await cds.connect.to("ProcessorService");
  const Incidents = srv.entities["Incidents"];

  return await srv.run([
    INSERT.into(Incidents).entries({title: 'test object1'}),
    INSERT.into(Incidents).entries({title: 'test object2'})
  ]);
}


class ProcessorService extends cds.ApplicationService {
  /** Registering custom event handlers */
  init() {
    this.before('UPDATE', 'Incidents', req => this.onUpdate(req))
    this.before(['CREATE', 'UPDATE'], 'Incidents', req => this.changeUrgencyDueToSubject(req.data))
    // Check provided bugreport.http file in `test` folder:
    this.on ('createSingle', createSingle);
    this.on ('createMultiple1', createMultiple1);
    this.on ('createMultiple2', createMultiple2);
    this.on ('createMultiple3', createMultiple3);
    return super.init()
  }

  changeUrgencyDueToSubject(data) {
    if (data) {
      const incidents = Array.isArray(data) ? data : [data]
      incidents.forEach(incident => {
        if (incident.title?.toLowerCase().includes('urgent')) {
          incident.urgency = { code: 'H', descr: 'High' }
        }
      })
    }
  }

  /** Custom Validation */
  async onUpdate(req) {
    const { status_code } = await SELECT.one(req.subject, i => i.status_code).where({ ID: req.data.ID })
    if (status_code === 'C') {
      return req.reject(`Can't modify a closed incident`)
    }
  }
}

module.exports = { ProcessorService }


// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// For demo purposess only...
const _require = id => {try{ return require(id) } catch(e) { if (e.code !== 'MODULE_NOT_FOUND') throw e }}
cds.once("served", ()=> _require('./alert-notifications')?.prototype.init.call(cds.services.ProcessorService))
