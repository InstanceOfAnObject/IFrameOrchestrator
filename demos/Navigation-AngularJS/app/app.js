angular.module('nav', ['ngRoute'])
    .config(['$routeProvider', function($routeProvider){
        
        $routeProvider
            .when('/item', {
                templateUrl: 'views/item.html',
                controller: 'Item',
                controllerAs: 'vm'
            })
            .otherwise({
                templateUrl: 'views/home.html',
                controller: 'Home',
                controllerAs: 'vm'
            });

    }])
    .run(['$rootScope', '$location', function($rootScope, $location){

        $rootScope.$on('$routeChangeSuccess', function (event, next, current) {
            var url = $location.path();
            //window.iframeOrchestratorClient.triggerEvent('global.frameRouteChange', url);
            //window.iframeOrchestratorClient.triggerEvent('global.scrollTop');
        });
        
    }]);