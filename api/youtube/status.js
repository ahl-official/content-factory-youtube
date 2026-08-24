// Not necessary anymore since we do synchronous execution, but provided to avoid 404s
module.exports = async function (req, res) {
    return res.status(200).json({ status: 'success' });
};
