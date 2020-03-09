let mount = function (id, vm) {
    window.addEventListener('load', function () {
        let element = document.getElementById(id);
        if (element) {
            vm.$mount(element);
        }
    });
};

export {mount};
