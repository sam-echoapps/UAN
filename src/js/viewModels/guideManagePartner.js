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
                    { "path" : "guideCreatePartner", "label" : "How to create a partner?"},
                    { "path" : "guideManagePartnerProfile", "label" : "How to manage a partner profile?"},
                    { "path" : "guideManagePartnerStudent", "label" : "How to assign a studnet to a partner?"},
                    { "path" : "guideManagePartnerReport", "label" : "How to manage Partner report?"},
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
                { path: '', redirect: 'guideCreatePartner' },
                { path: 'guideCreatePartner'},
                { path: 'guideManagePartnerProfile' },
                { path: 'guideManagePartnerStudent' },
                { path: 'guideManagePartnerReport' }
            ]);

            self.router.currentState.subscribe((args) => {
                const state = args.state;
                if (state) {
                    self.record(self.incidentData[state.params.index]);
                }
            });

            self.module = new ModuleRouterAdapter(self.router, {
                viewPath: 'views/Help/managePartner/',
                viewModelPath: 'viewModels/Help/managePartner/'
            });
        }
        
    }
    return ViewModel;
});