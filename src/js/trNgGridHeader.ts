﻿module TrNgGrid {
    export interface IGridSectionScope extends ng.IScope {
        grid:GridController;
        gridOptions: IGridOptions;
        gridLayoutSection: GridLayoutSection;
    }

    export interface IGridRowScope extends IGridSectionScope {
        gridLayoutRow: GridLayoutRow;
    }

    export interface IGridColumnScope extends IGridRowScope {
        gridColumnOptions: IGridColumnOptions;
        gridColumnLayout: IGridColumnLayoutOptions;
    }

    export interface IGridColumnSettingsScope extends IGridColumnOptions, IGridColumnLayoutOptions, ng.IScope {        
    }

    export interface IGridHeaderColumnSetupScope extends ng.IScope {
        gridColumnSetup: GridColumnSetupController;
    }

    /*
     * Set up the scope for the THEAD section
     */
    gridModule.directive(Constants.headerDirective, [
        () => {
            return {
                restrict: 'A',
                scope: true,
                require: "^" + Constants.tableDirective,
                link: {
                    pre(scope: IGridSectionScope, instanceElement: ng.IAugmentedJQuery, tAttrs: ng.IAttributes, gridController: GridController, transcludeFn: ng.ITranscludeFunction) {
                        scope.grid = gridController;
                        scope.gridOptions = gridController.gridOptions;
                        scope.gridLayoutSection = gridController.gridLayout.getSection(GridSectionType.Header);
                    }
                }
            }
        }
    ]);

    /*
    * Set up the row scope for the THEAD section
    */
    gridModule.directive(Constants.headerRowDirective, ["$compile", Constants.gridConfigurationService,
        ($compile: ng.ICompileService, gridConfiguration: IGridConfiguration) => {
            return {
                restrict: 'A',
                scope: true,
                require: "^" + Constants.tableDirective,
                compile($templateElement: ng.IAugmentedJQuery, $tAttrs: ng.IAttributes) {
                    // compile a standard cell and a placeholder
                    return {
                        pre($scope: IGridRowScope, $instanceElement: ng.IAugmentedJQuery, $tAttrs: ng.IAttributes, $controller: GridController, $transcludeFn: ng.ITranscludeFunction) {
                            $scope.gridLayoutRow = $scope.gridLayoutSection.registerRow();
                            $scope.$on("$destroy",() => {
                                $scope.gridLayoutSection.unregisterRow($scope.gridLayoutRow);
                            });
                        },
                        post($scope: IGridRowScope, $instanceElement: ng.IAugmentedJQuery, $tAttrs: ng.IAttributes, $controller: GridController, $transcludeFn: ng.ITranscludeFunction) {
                        }
                    }
                }
            }
        }
    ]);

    /*
     * Set up placeholders for the row
     */
    gridModule.directive(Constants.headerCellPlaceholderDirective, ["$compile", "$interpolate", Constants.gridConfigurationService,
        ($compile: ng.ICompileService, $interpolate:ng.IInterpolateService, gridConfiguration: IGridConfiguration) => {
            // prepare the auto-generated element
            var autoGeneratedCellTemplate = angular.element(gridConfiguration.templates.headerCellStandard);
            autoGeneratedCellTemplate.attr(Constants.headerCellDirectiveAttribute, "");
            autoGeneratedCellTemplate.attr(Constants.dataColumnIsAutoGeneratedAttribute, "true");
            autoGeneratedCellTemplate.attr("data-field-name", $interpolate.startSymbol() + "gridColumnLayout.fieldName" + $interpolate.endSymbol());

            return {
                restrict: 'A',
                require: "^" + Constants.tableDirective,
                transclude: "element",
                scope:true,
                compile($templatedElement: ng.IAugmentedJQuery, $tAttrs: ng.IAttributes) {

                    return {
                        pre($scope: IGridColumnScope, $instanceElement: ng.IAugmentedJQuery, $tAttrs: ng.IAttributes, $controller: GridController, $transcludeFn: ng.ITranscludeFunction) {
                            $scope.gridColumnLayout.placeholder = $instanceElement;
                        },
                        post($scope: IGridColumnScope, $instanceElement: ng.IAugmentedJQuery, $tAttrs: ng.IAttributes, $controller: GridController, $transcludeFn: ng.ITranscludeFunction) {
                            if ($scope.gridColumnLayout.isAutoGenerated) {

                                var autoGeneratedPreCompilationElement = autoGeneratedCellTemplate.clone();
                                $instanceElement.after(autoGeneratedPreCompilationElement);
                                var autoGeneratedElementLinkingFct = $compile(autoGeneratedPreCompilationElement);

                                // $scope.gridColumnOptions = $controller.getColumnOptions($scope.gridColumnLayout.fieldName);
                                // $instanceElement.after(autoGeneratedTemplateCell);                               

                                // trigger the registration of auto-generated cells
                                var autoGeneratedCell = autoGeneratedElementLinkingFct($scope);

                                $scope.$on("$destroy", () => {
                                    debugger;
                                    if (autoGeneratedCell) {
                                        autoGeneratedCell.remove();
                                        autoGeneratedCell = null;
                                    }

                                    if (autoGeneratedPreCompilationElement) {
                                        autoGeneratedPreCompilationElement.remove();
                                        autoGeneratedPreCompilationElement = null;
                                    }
                                });
                            }
                        }
                    };
                }
            };
        }
    ]);


    /*
     * Ensure the columns settings are extracted from the TH elements, and also ensure the scope is properly set.
     */
    gridModule.directive(Constants.headerCellDirective, ["$compile", Constants.gridConfigurationService,
        ($compile: ng.ICompileService, gridConfiguration: IGridConfiguration) => {
                return {
                    restrict: 'A',
                    require: "^" + Constants.tableDirective,
                    controller: ["$scope", "$controller", GridColumnSetupController],
                    scope: {
                        isCustomized: "@" + Constants.dataColumnIsCustomizedField,
                        isAutoGenerated: "@" + Constants.dataColumnIsAutoGeneratedField,

                        fieldName: "@",
                        displayName: "@",
                        displayAlign: "@",
                        displayFormat: "@",
                        enableSorting: "@",
                        enableFiltering: "@",
                        cellWidth: "@",
                        cellHeight: "@",
                        filter: "@",
                        colspan: "@"                        
                    },
                     /*
                      * interpolation runs at 100, we need to be more than that otherwise we'll be hitting
                      * https://github.com/angular/angular.js/issues/11304
                      */
                    priority: 101, 
                    controllerAs: "gridColumnSetup",
                    transclude: 'element',
                    terminal: true,
                    compile($templateElement: ng.IAugmentedJQuery, $tAttrs: ng.IAttributes) {
                        return {
                            pre($scope: IGridHeaderColumnSetupScope, $instanceElement: ng.IAugmentedJQuery, $tAttrs: ng.IAttributes, $controller: GridController, $transcludeFn: ng.ITranscludeFunction) {
                            },
                            post($scope: IGridHeaderColumnSetupScope, $instanceElement: ng.IAugmentedJQuery, $tAttrs: ng.IAttributes, $controller: GridController, $transcludeFn: ng.ITranscludeFunction) {
                                // by the time we get here, the interpolation has already properly set the bound vars to values
                                $scope.gridColumnSetup.prepareColumn();

                                var transcludedCellElement: ng.IAugmentedJQuery = null;

                                var setupNewScope = () => {
                                    if (transcludedCellElement) {
                                        transcludedCellElement.remove();
                                        transcludedCellElement = null;
                                    }

                                    var gridColumnScope = $scope.gridColumnSetup.columnScope;
                                    var gridColumnLayout = gridColumnScope.gridColumnLayout;
                                    if (gridColumnLayout.placeholder) {
                                        // link the element with the placeholder
                                        $transcludeFn(gridColumnScope, (newTranscludedCellElement: ng.IAugmentedJQuery) => {
                                            transcludedCellElement = newTranscludedCellElement;
                                            gridColumnLayout.placeholder.after(transcludedCellElement);

                                            if (!gridColumnLayout.isCustomized) {
                                                // add the standard cell contents as well
                                                var standardCellContentsTemplate = angular.element(gridConfiguration.templates.headerCellContentsStandard);
                                                transcludedCellElement.append(standardCellContentsTemplate);
                                                $compile(standardCellContentsTemplate)(gridColumnScope);
                                            }
                                        });
                                    }
                                };

                                $scope.$watch("gridColumnSetup.columnScope.gridColumnLayout.placeholder",(newPlaceholder: ng.IAugmentedJQuery, oldPlaceholder: ng.IAugmentedJQuery) => {
                                    if (newPlaceholder === oldPlaceholder) {
                                        return;
                                    }

                                    setupNewScope();
                                });

                                setupNewScope();
                            }
                        };
                    }
                };
            }
        ]);

}