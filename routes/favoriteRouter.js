const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Campsite = require('../models/campsite');

const favoriteRouter = express.Router();

//Favorites router
favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200) )
.get(cors.cors,  authenticate.verifyUser, (req, res, next) => {
    
    Favorite.find({user: req.user._id})
    .populate('user')
    .populate('campsites')
    .then(favorites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(`req = ${ req }`);
    console.log(`req user id: ${req.user._id}`);

    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        //Case if favorite campsite list don't exist for this user
        if (!favorites) {
            const favDocument = {campsites: req.body, user: req.user._id};
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
                res.setHeader('Content-Type', 'text/plain');
                res.end("All chosen Campsites are in Favorite list alraedy");
            }

        }  
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(`req.User._id = ${req.user._id}`);
    const filter =  {user: req.user._id} ;
    Favorite.findOneAndDelete( filter )
    .then(response => {
        if (response) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        } else {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain');
            res.end("You do not have any favorites to delete!");
        }
    })
    .catch(err => next(err));
});


//Favorites/:campsiteID router
favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200) )
.get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/:campsiteId');
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsiteCheck => {
        console.log(`campsiteCheck = ${campsiteCheck}`);

        //check if campsiteID in Favorites/:campsiteID parameter is legit campsite ID
        if (campsiteCheck){
            Favorite.findOne({user: req.user._id})
            .then(favorites => {
                //Case if Favorites document for logged in user exists
                if (favorites){
                    if ( (favorites.campsites).indexOf(req.params.campsiteId) === -1 ) {
                         //if camapside not icluded in favorite list - add it
                         let storedFavoriteCampsites = [];
                         (favorites.campsites).forEach( favStoredCampsite => { 
                             storedFavoriteCampsites = [...storedFavoriteCampsites, {"_id": favStoredCampsite}];
                             console.log (`storedFavoriteCampsites length = ${storedFavoriteCampsites.length}`);
                         });
                         storedFavoriteCampsites = [...storedFavoriteCampsites, {"_id": req.params.campsiteId}];
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
                    } else {
                        ////if camapside icluded in favorite list - send message "It's already in the list"
                        res.statusCode = 403;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end("This campsite is already in the list of yor favorites!");
                    }
                } else {
                    //case if Favirites document for logged in user does NOT exist
                    const campsiteNewArr = [{"_id": req.params.campsiteId}];
                    console.log(`campsite new favorites created. \n First el. ${campsiteNewArr[0]} campsiteID = ${campsiteNewArr[0].id}`);
                    const favDocument = {campsites: campsiteNewArr, user: req.user._id}
                    Favorite.create(favDocument)
                    .then(favorite => {
                        console.log('Favorite Created ', favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    });
                }
            })
            .catch(err => next(err));
        } else {
            //return error Campsite ID is not from the list of stored campsites
            console.log('Campsite ID is not from the list of stored campsites');
            res.statusCode = 403;
            res.end('Campsite ID from favorites/:campsiteId parameter is not from the list of stored campsites - ERROR');
        }
    })
    .catch(err => next(err));    
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/:campsiteId');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        if (favorites) {
            //case if favorites list exists for this user
            const indexInFavArr = (favorites.campsites).indexOf(req.params.campsiteId);
            if ( indexInFavArr === -1) {
                //case if Campsite ID to delete is not stored in campsite id list
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain');
                res.end("There is no camsite with that ID in list of your favorites");
            } else {
                //case when camsite ID exists in favorites - DELETE
                console.log(`we are DELETING campsite with id ${req.params.campsiteId} . Index: ${indexInFavArr} \n from ${favorites.campsites} `);
                favorites.campsites = (favorites.campsites).filter
                                      (campsiteId => (req.params.campsiteId).localeCompare(campsiteId)!== 0);
                favorites.save()
                .then (favorites => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                });
            }

        } else {
            //case if user does NOT have favorite list
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain');
            res.end("There is no favorite list for this user!!");
        }
    })
    .catch(err => next(err));      
   
});

module.exports = favoriteRouter;