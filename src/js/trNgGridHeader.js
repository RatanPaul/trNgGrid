var TrNgGrid;
(function (TrNgGrid) {
    TrNgGrid.gridModule.directive(TrNgGrid.Constants.headerDirective, [
        function () {
            return {
                restrict: 'A',
                scope: true,
                require: "^" + TrNgGrid.Constants.tableDirective,
                link: {
                    pre: function (scope, instanceElement, tAttrs, gridController, transcludeFn) {
                        scope.grid = gridController;
                        scope.gridOptions = gridController.gridOptions;
                        scope.gridLayoutSection = gridController.gridLayout.getSection(TrNgGrid.GridSectionType.Header);
                    }
                }
            };
        }
    ]);
    TrNgGrid.gridModule.directive(TrNgGrid.Constants.headerRowDirective, ["$compile", TrNgGrid.Constants.gridConfigurationService, function ($compile, gridConfiguration) {
        return {
            restrict: 'A',
            scope: true,
            require: "^" + TrNgGrid.Constants.tableDirective,
            compile: function ($templateElement, $tAttrs) {
                return {
                    pre: function ($scope, $instanceElement, $tAttrs, $controller, $transcludeFn) {
                        $scope.gridLayoutRow = $scope.gridLayoutSection.registerRow();
                        $scope.$on("$destroy", function () {
                            $scope.gridLayoutSection.unregisterRow($scope.gridLayoutRow);
                        });
                    },
                    post: function ($scope, $instanceElement, $tAttrs, $controller, $transcludeFn) {
                    }
                };
            }
        };
    }]);
    TrNgGrid.gridModule.directive(TrNgGrid.Constants.headerCellPlaceholderDirective, ["$compile", "$interpolate", TrNgGrid.Constants.gridConfigurationService, function ($compile, $interpolate, gridConfiguration) {
        var autoGeneratedCellTemplate = angular.element(gridConfiguration.templates.headerCellStandard);
        autoGeneratedCellTemplate.attr(TrNgGrid.Constants.headerCellDirectiveAttribute, "");
        autoGeneratedCellTemplate.attr(TrNgGrid.Constants.dataColumnIsAutoGeneratedAttribute, "true");
        autoGeneratedCellTemplate.attr("data-field-name", $interpolate.startSymbol() + "gridColumnLayout.fieldName" + $interpolate.endSymbol());
        return {
            restrict: 'A',
            require: "^" + TrNgGrid.Constants.tableDirective,
            transclude: "element",
            scope: true,
            compile: function ($templatedElement, $tAttrs) {
                return {
                    pre: function ($scope, $instanceElement, $tAttrs, $controller, $transcludeFn) {
                        $scope.gridColumnLayout.placeholder = $instanceElement;
                    },
                    post: function ($scope, $instanceElement, $tAttrs, $controller, $transcludeFn) {
                        if ($scope.gridColumnLayout.isAutoGenerated) {
                            var autoGeneratedPreCompilationElement = autoGeneratedCellTemplate.clone();
                            $instanceElement.after(autoGeneratedPreCompilationElement);
                            var autoGeneratedElementLinkingFct = $compile(autoGeneratedPreCompilationElement);
                            var autoGeneratedCell = autoGeneratedElementLinkingFct($scope);
                            $scope.$on("$destroy", function () {
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
    }]);
    TrNgGrid.gridModule.directive(TrNgGrid.Constants.headerCellDirective, ["$compile", TrNgGrid.Constants.gridConfigurationService, function ($compile, gridConfiguration) {
        return {
            restrict: 'A',
            require: "^" + TrNgGrid.Constants.tableDirective,
            controller: ["$scope", "$controller", TrNgGrid.GridColumnSetupController],
            scope: {
                isCustomized: "@" + TrNgGrid.Constants.dataColumnIsCustomizedField,
                isAutoGenerated: "@" + TrNgGrid.Constants.dataColumnIsAutoGeneratedField,
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
            priority: 101,
            controllerAs: "gridColumnSetup",
            transclude: 'element',
            terminal: true,
            compile: function ($templateElement, $tAttrs) {
                return {
                    pre: function ($scope, $instanceElement, $tAttrs, $controller, $transcludeFn) {
                    },
                    post: function ($scope, $instanceElement, $tAttrs, $controller, $transcludeFn) {
                        $scope.gridColumnSetup.prepareColumn();
                        var transcludedCellElement = null;
                        var setupNewScope = function () {
                            if (transcludedCellElement) {
                                transcludedCellElement.remove();
                                transcludedCellElement = null;
                            }
                            var gridColumnScope = $scope.gridColumnSetup.columnScope;
                            var gridColumnLayout = gridColumnScope.gridColumnLayout;
                            if (gridColumnLayout.placeholder) {
                                $transcludeFn(gridColumnScope, function (newTranscludedCellElement) {
                                    transcludedCellElement = newTranscludedCellElement;
                                    gridColumnLayout.placeholder.after(transcludedCellElement);
                                    if (!gridColumnLayout.isCustomized) {
                                        var standardCellContentsTemplate = angular.element(gridConfiguration.templates.headerCellContentsStandard);
                                        transcludedCellElement.append(standardCellContentsTemplate);
                                        $compile(standardCellContentsTemplate)(gridColumnScope);
                                    }
                                });
                            }
                        };
                        $scope.$watch("gridColumnSetup.columnScope.gridColumnLayout.placeholder", function (newPlaceholder, oldPlaceholder) {
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
    }]);
})(TrNgGrid || (TrNgGrid = {}));