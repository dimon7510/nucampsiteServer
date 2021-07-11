const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

//Favorites router
favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200) )
.get(cors.cors,  authenticate.verifyUser, (req, res, next) => {
    
    Favorite.find({})
    .populate('user')
    .populate('campsites')
    .then(favorites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    })
    .catch(err => next(err));
    /*
    Campsite.find()
    .populate('comments.author')
    .then(campsites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsites);
    })
    .catch(err => next(err));
    */
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(`req = ${ req }`);
    console.log(`req user id: ${req.user._id}`);

    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        //Case if favorite campsite list don't exist for this user
        if (!favorites) {
            const favDocument = {campsites: req.body, user: req.user._id}
            Favorite.create(favDocument)
            .then(favorite => {
                console.log('Favorite Created ', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
        }
        else {
            console.log (`favorites ${favorites}  \n favorites.campsites ${favorites.campsites} \n req.body ${req.body}`);
            //check if one of campsides included in retrieved favorites
            const favoriteCampsitesArrForStore = (req.body).filter(favInputCampsite => {
                let included = false;
                (favorites.campsites).forEach( favStoredCampsite => { 
                    console.log (`favInputCampsite._id ${favInputCampsite._id}  \n favStoredCampsite ${favStoredCampsite}`);
                    if ( (favInputCampsite._id).localeCompare(favStoredCampsite) === 0 ) included = true;
                });
                console.log(`not included ${!included}`);
                return !included;
              });
              
            console.log(`favoriteCampsitesArrForStore ${favoriteCampsitesArrForStore} with length ${favoriteCampsitesArrForStore.length}`);
            
            if (favoriteCampsitesArrForStore.length>0) {
                //case if some or all campsites from request body need to be added to favorite list
                let storedFavoriteCampsites = [];
                (favorites.campsites).forEach( favStoredCampsite => { 
                    storedFavoriteCampsites = [...storedFavoriteCampsites, {"_id": favStoredCampsite}];
                    console.log (`storedFavoriteCampsites length = ${storedFavoriteCampsites.length}`);
                });
                storedFavoriteCampsites = [...storedFavoriteCampsites,...favoriteCampsitesArrForStore];
                console.log(`new length of req.body ${req.body.length}`);
                const filter =  {user: req.user._id} ;
                const update = {campsites: storedFavoriteCampsites };
                Favorite.findOneAndUpdate(filter, update, {
                    new: true
                  })
                .populate('user')
                .populate('campsites')
                .then(favorites => {
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json');
                      res.json(favorites);
                });
            }
            else{
                //case where all campsites from request body are already included in favorite list
                res.statusCode = 403;
                res.end("All chosen Campsites are in Favorite list alraedy");
            }

        }
       
    })
    .catch(err => next(err));

    /*
    Campsite.create(req.body)
    .then(campsite => {
        console.log('Campsite Created ', campsite);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
    })
    .catch(err => next(err));
    */
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    /*
    res.statusCode = 403;
    res.end('PUT operation not supported on /campsites');
    */
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    /*
    Campsite.deleteMany()
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
    */
});

//Favorites/campsiteID router
favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200) )
.get(cors.cors, (req, res, next) => {
    /*
    Campsite.findById(req.params.campsiteId)
    .populate('comments.author')
    .then(campsite => {
        console.log(`Campsite by ID ${campsite}`);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
    })
    .catch(err => next(err));
    */
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    /*
    res.statusCode = 403;
    res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
    */
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    /*
    Campsite.findByIdAndUpdate(req.params.campsiteId, {
        $set: req.body
    }, { new: true })
    .then(campsite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
    })
    .catch(err => next(err));
    */
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    /*
    Campsite.findByIdAndDelete(req.params.campsiteId)
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
    */
});

module.exports = favoriteRouter;