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
                    { "path" : "guideCreatePartnerStudent", "label" : "How to add a student in UAN CRM?"},
                    { "path" : "guideManagePartnerStudentSearch", "label" : "How to search for a student in UAN CRM?"},
                    { "path" : "guideManagePartnerStudentEdit", "label" : "How to edit a student profile?"},
                    { "path" : "guideManagePartnerStudentStatus", "label" : "How to changes the status of student?"},
                    { "path" : "guideManagePartnerStudentLog", "label" : "How to add log in student profile?"},
                    { "path" : "guideManagePartnerStudentApplication", "label" : "How to create an application for student?"},
                    { "path" : "guideManagePartnerStudentFinalChoice", "label" : "How to add final choice for a student?"},
                    { "path" : "guideManagePartnerStudentReport", "label" : "How to get student manage report?"},
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
                { path: '', redirect: 'guideCreatePartnerStudent' },
                { path: 'guideCreatePartnerStudent'},
                { path: 'guideManagePartnerStudentSearch' },
                { path: 'guideManagePartnerStudentEdit' },
                { path: 'guideManagePartnerStudentStatus' },
                { path: 'guideManagePartnerStudentLog' },
                { path: 'guideManagePartnerStudentApplication' },
                { path: 'guideManagePartnerStudentFinalChoice' },
                { path: 'guideManagePartnerStudentReport' },
            ]);

            self.router.currentState.subscribe((args) => {
                const state = args.state;
                if (state) {
                    self.record(self.incidentData[state.params.index]);
                }
            });

            self.module = new ModuleRouterAdapter(self.router, {
                viewPath: 'views/Help/managePartnerView/',
                viewModelPath: 'viewModels/Help/managePartnerView/'
            });
        }
        
    }
    return ViewModel;
});