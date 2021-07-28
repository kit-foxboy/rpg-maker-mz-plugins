/*:
 * @target MZ
 * 
 * @author Geoff "Kit Foxboy" Lambert
 * @plugindesc My custom job system
 * 
 * @param Dev Mode On
 * @type boolean
 * @desc Enable debugging features
 * @default false
 * 
 * @command unlockActorJob
 * @text Unlock an actor's job
 * @desc The job can now been seen and used in the menus for the actor.
 * 
 * @arg actorId
 * @type actor
 * 
 * @arg classId
 * @type class
 * 
 * @command unlockJobForAll
 * @text Unlock job for all actors
 * @desc The job can now been seen and used in the menus all actor.
 * 
 * @arg classId
 * @type class
 * 
 * @command changeActorJob
 * @text Change an actor's job
 * @desc Change an actor's job. This will automatically update stats, skills, etc.
 * 
 * @arg actorId
 * @type actor
 * 
 * @arg classId
 * @type class
 * 
 * @help 
 * TODO
 * 
 */

;
(() => {

    ////PLUGIN MANAGER
    //get parameters
    const isDevMode = !!PluginManager.parameters('devModeOn');

    ////FUNCTIONS
    /**
     * Create a new job
     * @param {number} classId the RPG Maker class id
     * @param {number} jobLevel the starting job level
     * @param {number} jobLevel the starting job level
     * @param {boolean} isLocked if true, the job appears in menus and can be changed
     * @returns {Object} the new job
     */
    const newJob = function (classId, jobLevel = 1, jobExp = 0, isLocked = true) {
        return {
            classId,
            jobLevel,
            jobExp,
            isLocked
        };
    };

    /**
     * Get a list of new jobs
     * @param {Object} dataClasses the RPG Maker data classes global
     * @returns {Array.<Object>} a new list of jobs
     */
    const newJobList = function(dataClasses, defaultClassId) {
        const jobs = [];
        dataClasses.forEach((dataClass) => {
            if (dataClass && !!dataClass.meta.job) {
                const startingLevel = (dataClass.meta.startingLevel) ? parseInt(dataClass.meta.startingLevel) : 1 ;
                const startingExp = (dataClass.meta.startingExp) ? parseInt(dataClass.meta.startingExp) : 0 ;
                const isLocked = (!!dataClass.meta.locked);
                jobs[dataClass.id] = newJob(dataClass.id, startingLevel, startingExp, isLocked);
            }
        });

        return {
            jobs,
            defaultJob: jobs[defaultClassId],
            currentJob: jobs[defaultClassId],
            changeJob(classId) { this.currentJob = jobs[classId]; }
        }
    }

    //define command handlers
    /**
     * Command to change an actor's job
     * @param {Object} args an object containing the actor id and new class id
     */
    PluginManager.registerCommand('MasterApprenticeSystem', 'changeActorJob', (args = {}) => {
        
        //parse args
        let { actorId, classId } = args;
        if (isDevMode) {
            if (!actorId || 
                isNaN(parseInt(actorId) ||
                !$gameActors.actor(parseInt(actorId)) ||
                !classId ||
                isNaN(classId) ||
                !actor.jobs()[parseInt(classId)]
            )) {
                console.log('ERROR: missing or invalid parameters supplied for plugin command: changeJob');
            }
        }

        //parse arguments
        let actor = $gameActors.actor(parseInt(actorId));
        classId = parseInt(classId);

        //update actor
        actor.changeJob(classId);
        actor.initSkills();
        actor.releaseUnequippableItems();
        actor.refresh();
    });

    /**
     * Command to unlock an actor's job
     * @param {Object} args an object containing the actor id and new class id
     */
    PluginManager.registerCommand('MasterApprenticeSystem', 'unlockActorJob', (args) => {

    });


    ////RPG MAKER OVERRIDES
    let setupActors = Game_Actor.prototype.setup;

    /**
     * Called when setting up a new Game_Actor
     * @override
     * @param {number} actorId the actor's id
     */
    Game_Actor.prototype.setup = function(actorId) {
        setupActors.call(this, actorId);
        
        this._jobs = newJobList($dataClasses, this._classId);
    };

    /**
     * Called when an actor's current class is requested
     * @override
     * @param {number} actorId the actor's id
     */
    Game_Actor.prototype.currentClass = function() {
        return (this._jobs) ? $dataClasses[this._jobs.currentJob.classId] : $dataClasses[this._classId];
    }

    /**
     * Changes an actor's job
     * @param {number} classId the new job class id
     */
    Game_Actor.prototype.changeJob = function(classId) {
        this._jobs.changeJob(classId);
    }

})();