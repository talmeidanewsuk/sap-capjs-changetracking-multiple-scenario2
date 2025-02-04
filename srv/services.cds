using { sap.capire.incidents as my } from '../db/schema';

/**
 * Service used by support personell, i.e. the incidents' 'processors'.
 */
service ProcessorService {
  entity Incidents as projection on my.Incidents;
  entity Customers @readonly as projection on my.Customers;

  action createSingle() returns String;
  action createMultiple1() returns String;
  action createMultiple2() returns String;
  action createMultiple3() returns String;
}

/**
 * Service used by administrators to manage customers and incidents.
 */
service AdminService {
  entity Customers as projection on my.Customers;
  entity Incidents as projection on my.Incidents;
}

annotate ProcessorService.Incidents with @odata.draft.enabled; 
annotate ProcessorService with @(requires: 'support');
annotate AdminService with @(requires: 'admin');
annotate ProcessorService.Incidents {
  customer @changelog: [customer.name];
  title    @changelog;
  status   @changelog;
}