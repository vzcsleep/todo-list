exports.getDate = function() {
    const today = new Date();

    const options = {
        month: "short",
        weekday: "long", 
        day: "numeric"
    };

    return today.toLocaleDateString("en-us", options);
};