/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/***************************************************************cu*****************************************************
 *
 * Speridian Technologies-IN-NS
 *
 * SPETIN-465:User Event Script for Timesheet: Conditional Custom Field Handling Based on Employee and Project Subsidiary
 *
 ********************************************************************************************************************
 *
 * Author: Jobin & Jismi
 *
 * Date Created: 30-September-2025
 *
 * COPYRIGHT © 2025 Jobin & Jismi. All rights reserved.
 * This script is a proprietary product of Jobin & Jismi and is protected by copyright law and international treaties.
 * Unauthorized reproduction or distribution of this script, or any portion of it, may result in severe civil and criminal 
 * penalties,
 * and will be prosecuted to the maximum extent possible under the law.
 *
 * Description: This User Event script enforces logic after Timesheet submission based on subsidiary and employee matching. 
 * If both subsidiaries and the employee match, it sets a custom rate to 100 on Time Sheet. If only subsidiaries match, a checkbox is 
 * marked true on the Time sheet. If subsidiaries differ, no action is taken. 
 *
 * REVISION HISTORY
 *
 * @version 1.0 SPETIN-465: 30-September-2025 : Initial build by JJ0402.
 ******************************************************************************************************************/
define(["N/record", "N/search"], /**
 * @param{record} record
 * @param{search} search
 */
  (record, search) => {
    const TM_FIELD = "custcol_jj_t_m";
    const FIXED_FIELD = "custcol_jj_fixed";
    const TM_VALUE = 100;
    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */

    const afterSubmit = (scriptContext) => {
      try {
        let newRecordId = scriptContext.newRecord.id;
        const details = getTimebillDetails(newRecordId);
        if (details) {
          let employeeSubsidiary = details.employeeSubsidiary;
          let projectSubsidiary = details.projectSubsidiary;
          let employeeId = details.employeeId;
          
          log.debug('Employee ID', employeeId);
          log.debug('Employee Subsidiary', employeeSubsidiary);
          log.debug('Project Subsidiary', projectSubsidiary);

         
          if (employeeSubsidiary !== projectSubsidiary) {
            try {
              record.submitFields({
                type: "timebill",
                id: newRecordId,
                values: {
                  'custcol_jj_fixed': false,
                  'custcol_jj_t_m': null
                }
              })
            }
            catch (e) {
              log.error("SubmitFields Error", e.message);
            }
          } else {
            const matchFound = searchInternalBilling(
              employeeId,
              employeeSubsidiary
            );
              record.submitFields({
                type: "timebill",
                id: newRecordId,
                values: {
                  'custcol_jj_fixed': matchFound ? false : true,
                  'custcol_jj_t_m': matchFound ? TM_VALUE : ""
                }
              })          
          }
        }
      } catch (e) {
        log.error("Error in afterSubmit", e);
      }
    };
    
    /**
 * Retrieves employee ID, employee subsidiary, and project subsidiary from a timebill record
 * using traditional checks for field safety.
 *
 * @param {string} newRecordId - The internal ID of the timebill record.
 * @returns {Object} An object containing employeeId, employeeSubsidiary, and projectSubsidiary.
 */
function getTimebillDetails(newRecordId) {
  const timebillDetails = search.lookupFields({
    type: "timebill",
    id: newRecordId,
    columns: ['employee','employee.subsidiary','job.subsidiary']
  });
      let employeeId = timebillDetails.employee[0].value
      log.debug("employeeId",employeeId);
        log.debug("timebillDetails",timebillDetails);
      let employeeSubsidiary = timebillDetails["employee.subsidiary"][0].value
      let projectSubsidiary = timebillDetails["job.subsidiary"][0].value
  return {
          employeeId,
          employeeSubsidiary,
          projectSubsidiary};
  
}


    /**
     * Checks if an internal billing record exists for a given employee and subsidiary.
     *
     * @function
     * @param {string} employeeId - The internal ID of the employee.
     * @param {string} subsidiaryId - The internal ID of the subsidiary.
     * @returns {boolean} True if a matching internal billing record is found, otherwise false.
     */

    function searchInternalBilling(employeeId, subsidiaryId) {
      const ibSearch = search.create({
        type: "customrecord_jj_internal_billing",
        filters: [
          ["custrecord_jj_employee", "is", employeeId],
          "AND",
          ["custrecord_jj_subsidiary", "is", subsidiaryId],
        ],
        columns: ["internalid"],
      });

      const result = ibSearch.run().getRange({ start: 0, end: 1 });
      return result.length > 0;
    }

    return { afterSubmit };
  });
