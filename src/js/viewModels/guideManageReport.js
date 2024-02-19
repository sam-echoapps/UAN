define(['ojs/ojcore', 'knockout', 'jquery', 'appController', "ojs/ojmodulerouter-adapter", 
    "ojs/ojarraydataprovider", "ojs/ojprogress-bar",
    "ojs/ojknockout", "ojs/ojlistview", "ojs/ojmodule-element"], 
    function (oj, ko, $, app, ModuleRouterAdapter, ArrayDataProvider) {
    "use strict";
    class ViewModel {
        constructor(args) {
            var self = this

            self.record = ko.observable();
                
            self.router = args.parentRouter;

            self.connected = function () {
                if (sessionStorage.getItem("userName") == null) {
                    self.router.go({path : 'signin'});
                }
                else {
                    app.onAppSuccess();
                }
            }

            var routerLength = args.parentRouter._routes.length;
            
            var records = { 
                "childPath" : [
                    { "path" : "guideApplicationSubmition", "label" : "How to get a Staff Application Submission Report?"},
                    { "path" : "guideReaasignoffStaff", "label" : "How to reassign a student to another staff/office?"},
                    { "path" : "guideMissedReminder", "label" : "How to get Missed Reminder Report?"},
                    { "path" : "guideApplicantReport", "label" : "How to get an Applicant Report?"},
                    { "path" : "guideStudentManagerReport", "label" : "How to get Student Manager Report?"},
                    { "path" : "guideStudentLogReport", "label" : "How to get Student Log Report?"},
                    { "path" : "guideFinalChoiceReport", "label" : "How to get Final Choice Report?"},
                    { "path" : "guideAllApplicationSummaryReport", "label" : "How to get All Application Summary Report?"},
                ]
            }

            self.incidentData = records.childPath;
            
            self.dataProvider = new ArrayDataProvider(self.incidentData);
            
            self.selection = ko.pureComputed({
                read: () => {
                    const selected = [];
                    const record = self.record();
                    
                    if (record) {
                        var index = self.incidentData.indexOf(record);
                        selected.push(index);
                    }
                    return selected;
                },
                
                write: (selected) => {
                    var path = self.incidentData[selected[0]].path
                    
                    self.router.go({ path: path, params: { index: selected[0] } });
                }
            });
            
            self.args = args;
            // Create a child router with one default path
            self.router = self.args.parentRouter.createChildRouter([
                { path: '', redirect: 'guideApplicationSubmition' },
                { path: 'guideApplicationSubmition' },
                { path: 'guideReaasignoffStaff' },
                { path: 'guideMissedReminder' },
                { path: 'guideApplicantReport' },
                { path : "guideStudentManagerReport"},
                { path : "guideStudentLogReport"},
                { path : "guideFinalChoiceReport"},
                { path : "guideAllApplicationSummaryReport"},
            ]);

            self.router.currentState.subscribe((args) => {
                const state = args.state;
                if (state) {
                    self.record(self.incidentData[state.params.index]);
                }
            });

            self.module = new ModuleRouterAdapter(self.router, {
                viewPath: 'views/Help/manageReport/',
                viewModelPath: 'viewModels/Help/manageReport/'
            });
        }
        
    }
    return ViewModel;
});