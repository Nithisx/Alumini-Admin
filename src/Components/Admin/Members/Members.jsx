                     ? emitTypedArrayChunk(request, id, "m", value)
                                : value instanceof DataView
                                  ? emitTypedArrayChunk(request, id, "V", value)
                                  : ((value = stringify(value, task.toJSON)),
                                    emitModelChunk(request, task.id, value));
    }
    function erroredTask(request, task, error) {
      task.timed && emitTimingChunk(request, task.id, performance.now());
      request.abortableTasks.delete(task);
      task.status = ERRORED$1;
      if (
        "object" === typeof error &&
        null !== error &&
        error.$$typeof === REACT_POSTPONE_TYPE
      )
        logPostpone(request, error.message, task),
          emitPostponeChunk(request, task.id, error);
      else {
        var digest = logRecoverableError(request, error, task);
        emitErrorChunk(request, task.id, digest, error);
      }
    }
    function retryTask(request, task) {
      if (task.status === PENDING$1) {
        var prevDebugID = debugID;
        task.status = RENDERING;
        try {
          modelRoot = task.model;
          debugID = task.id;
          var resolvedModel = renderModelDestructive(
            request,
            task,
            emptyRoot,
            "",
            task.model
          );
          debugID = null;
          modelRoot = resolvedModel;
          task.keyPath = null;
          task.implicitSlot = !1;
          var currentEnv = (0, request.environmentName)();
          currentEnv !== task.environmentName &&
            (request.pendingChunks++,
            emitDebugChunk(request, task.id, { env: currentEnv }));
          task.timed && emitTimingChunk(request, task.id, performance.now());
          if ("object" === typeof resolvedModel && null !== resolvedModel)
            request.writtenObjects.set(
              resolvedModel,
              serializeByValueID(task.id)
            ),
              emitChunk(request, task, resolvedModel);
          else {
            var json = stringify(resolvedModel);
            emitModelChunk(request, task.id, json);
          }
          request.abortableTasks.delete(task);
          task.status = COMPLETED;
        } catch (thrownValue) {
          if (request.status === ABORTING)
            if (
              (request.abortableTasks.delete(task),
              (task.status = ABORTED),
              request.type === PRERENDER)
            )
              request.pendingChunks--;
            else {
              var model = stringify(serializeByValueID(request.fatalError));
              emitModelChunk(request, task.id, model);
            }
          else {
            var x =
              thrownValue === SuspenseException
                ? getSuspendedThenable()
                : thrownValue;
            if (
              "object" === typeof x &&
              null !== x &&
              "function" === typeof x.then
            ) {
              task.status = PENDING$1;
              task.thenableState = getThenableStateAfterSuspending();
              var ping = task.ping;
              x.then(ping, ping);
            } else erroredTask(request, task, x);
          }
        } finally {
          debugID = prevDebugID;
        }
      }
    }
    function tryStreamTask(request, task) {
      var prevDebugID = debugID;
      debugID = null;
      try {
        emitChunk(request, task, task.model);
      } finally {
        debugID = prevDebugID;
      }
    }
    function performWork(request) {
      var prevDispatcher = ReactSharedInternalsServer.H;
      ReactSharedInternalsServer.H = HooksDispatcher;
      var prevRequest = currentRequest;
      currentRequest$1 = currentRequest = request;
      var hadAbortableTasks = 0 < request.abortableTasks.size;
      try {
        var pingedTasks = request.pingedTasks;
        request.pingedTasks = [];
        for (var i = 0; i < pingedTasks.length; i++)
          retryTask(request, pingedTasks[i]);
        null !== request.destination &&
          flushCompletedChunks(request, request.destination);
        if (hadAbortableTasks && 0 === request.abortableTasks.size) {
          var onAllReady = request.onAllReady;
          onAllReady();
        }
      } catch (error) {
        logRecoverableError(request, error, null), fatalError(request, error);
      } finally {
        (ReactSharedInternalsServer.H = prevDispatcher),
          (currentRequest$1 = null),
          (currentRequest = prevRequest);
      }
    }
    function abortTask(task, request, errorId) {
      task.status !== RENDERING &&
        ((task.status = ABORTED),
        task.timed && emitTimingChunk(request, task.id, performance.now()),
        (errorId = serializeByValueID(errorId)),
        (task = encodeReferenceChunk(request, task.id, errorId)),
        request.completedErrorChunks.push(task));
    }
    function flushCompletedChunks(request, destination) {
      currentView = new Uint8Array(2048);
      writtenBytes = 0;
      try {
        for (
          var importsChunks = request.completedImportChunks, i = 0;
          i < importsChunks.length;
          i++
        )
          if (
            (request.pendingChunks--,
            !writeChunkAndReturn(destination, importsChunks[i]))
          ) {
            request.destination = null;
            i++;
            break;
          }
        importsChunks.splice(0, i);
        var hintChunks = request.completedHintChunks;
        for (i = 0; i < hintChunks.length; i++)
          if (!writeChunkAndReturn(destination, hintChunks[i])) {
            request.destination = null;
            i++;
            break;
          }
        hintChunks.splice(0, i);
        var regularChunks = request.completedRegularChunks;
        for (i = 0; i < regularChunks.length; i++)
          if (
            (request.pendingChunks--,
            !writeChunkAndReturn(destination, regularChunks[i]))
          ) {
            request.destination = null;
            i++;
            break;
          }
        regularChunks.splice(0, i);
        var errorChunks = request.completedErrorChunks;
        for (i = 0; i < errorChunks.length; i++)
          if (
            (request.pendingChunks--,
            !writeChunkAndReturn(destination, errorChunks[i]))
          ) {
            request.destination = null;
            i++;
            break;
          }
        errorChunks.splice(0, i);
      } finally {
        (request.flushScheduled = !1),
          currentView &&
            0 < writtenBytes &&
            (destination.enqueue(
              new Uint8Array(currentView.buffer, 0, writtenBytes)
            ),
            (currentView = null),
            (writtenBytes = 0));
      }
      0 === request.pendingChunks &&
        (cleanupTaintQueue(request),
        (request.status = CLOSED),
        destination.close(),
        (request.destination = null));
    }
    function startWork(request) {
      request.flushScheduled = null !== request.destination;
      scheduleMicrotask(function () {
        return performWork(request);
      });
      scheduleWork(function () {
        request.status === OPENING && (request.status = 11);
      });
    }
    function enqueueFlush(request) {
      !1 === request.flushScheduled &&
        0 === request.pingedTasks.length &&
        null !== request.destination &&
        ((request.flushScheduled = !0),
        scheduleWork(function () {
          request.flushScheduled = !1;
          var destination = request.destination;
          destination && flushCompletedChunks(request, destination);
        }));
    }
    function startFlowing(request, destination) {
      if (request.status === CLOSING)
        (request.status = CLOSED),
          closeWithError(destination, request.fatalError);
      else if (request.status !== CLOSED && null === request.destination) {
        request.destination = destination;
        try {
          flushCompletedChunks(request, destination);
        } catch (error) {
          logRecoverableError(request, error, null), fatalError(request, error);
        }
      }
    }
    function abort(request, reason) {
      try {
        11 >= request.status && (request.status = ABORTING);
        var abortableTasks = request.abortableTasks;
        if (0 < abortableTasks.size) {
          if (request.type === PRERENDER)
            abortableTasks.forEach(function (task) {
              task.status !== RENDERING &&
                ((task.status = ABORTED), request.pendingChunks--);
            });
          else if (
            "object" === typeof reason &&
            null !== reason &&
            reason.$$typeof === REACT_POSTPONE_TYPE
          ) {
            logPostpone(request, reason.message, null);
            var errorId = request.nextChunkId++;
            request.fatalError = errorId;
            request.pendingChunks++;
            emitPostponeChunk(request, errorId, reason);
            abortableTasks.forEach(function (task) {
              return abortTask(task, request, errorId);
            });
          } else {
            var error =
                void 0 === reason
                  ? Error(
                      "The render was aborted by the server without a reason."
                    )
                  : "object" === typeof reason &&
                      null !== reason &&
                      "function" === typeof reason.then
                    ? Error(
                        "The render was aborted by the server with a promise."
                      )
                    : reason,
              digest = logRecoverableError(request, error, null),
              _errorId2 = request.nextChunkId++;
            request.fatalError = _errorId2;
            request.pendingChunks++;
            emitErrorChunk(request, _errorId2, digest, error);
            abortableTasks.forEach(function (task) {
              return abortTask(task, request, _errorId2);
            });
          }
          abortableTasks.clear();
          var onAllReady = request.onAllReady;
          onAllReady();
        }
        var abortListeners = request.abortListeners;
        if (0 < abortListeners.size) {
          var _error =
            "object" === typeof reason &&
            null !== reason &&
            reason.$$typeof === REACT_POSTPONE_TYPE
              ? Error("The render was aborted due to being postponed.")
              : void 0 === reason
                ? Error(
                    "The render was aborted by the server without a reason."
                  )
                : "object" === typeof reason &&
                    null !== reason &&
                    "function" === typeof reason.then
                  ? Error(
                      "The render was aborted by the server with a promise."
                    )
                  : reason;
          abortListeners.forEach(function (callback) {
            return callback(_error);
          });
          abortListeners.clear();
        }
        null !== request.destination &&
          flushCompletedChunks(request, request.destination);
      } catch (error$2) {
        logRecoverableError(request, error$2, null),
          fatalError(request, error$2);
      }
    }
    function resolveServerReference(bundlerConfig, id) {
      var name = "",
        resolvedModuleData = bundlerConfig[id];
      if (resolvedModuleData) name = resolvedModuleData.name;
      else {
        var idx = id.lastIndexOf("#");
        -1 !== idx &&
          ((name = id.slice(idx + 1)),
          (resolvedModuleData = bundlerConfig[id.slice(0, idx)]));
        if (!resolvedModuleData)
          throw Error(
            'Could not find the module "' +
              id +
              '" in the React Server Manifest. This is probably a bug in the React Server Components bundler.'
          );
      }
      return [resolvedModuleData.id, resolvedModuleData.chunks, name];
    }
    function requireAsyncModule(id) {
      var promise = __turbopack_require__(id);
      if ("function" !== typeof promise.then || "fulfilled" === promise.status)
        return null;
      promise.then(
        function (value) {
          promise.status = "fulfilled";
          promise.value = value;
        },
        function (reason) {
          promise.status = "rejected";
          promise.reason = reason;
        }
      );
      return promise;
    }
    function ignoreReject() {}
    function preloadModule(metadata) {
      for (
        var chunks = metadata[1], promises = [], i = 0;
        i < chunks.length;
        i++
      ) {
        var chunkFilename = chunks[i],
          entry = chunkCache.get(chunkFilename);
        if (void 0 === entry) {
          entry = __turbopack_load__(chunkFilename);
          promises.push(entry);
          var resolve = chunkCache.set.bind(chunkCache, chunkFilename, null);
          entry.then(resolve, ignoreReject);
          chunkCache.set(chunkFilename, entry);
        } else null !== entry && promises.push(entry);
      }
      return 4 === metadata.length
        ? 0 === promises.length
          ? requireAsyncModule(metadata[0])
          : Promise.all(promises).then(function () {
              return requireAsyncModule(metadata[0]);
            })
        : 0 < promises.length
          ? Promise.all(promises)
          : null;
    }
    function requireModule(metadata) {
      var moduleExports = __turbopack_require__(metadata[0]);
      if (4 === metadata.length && "function" === typeof moduleExports.then)
        if ("fulfilled" === moduleExports.status)
          moduleExports = moduleExports.value;
        else throw moduleExports.reason;
      return "*" === metadata[2]
        ? moduleExports
        : "" === metadata[2]
          ? moduleExports.__esModule
            ? moduleExports.default
            : moduleExports
          : moduleExports[metadata[2]];
    }
    function Chunk(status, value, reason, response) {
      this.status = status;
      this.value = value;
      this.reason = reason;
      this._response = response;
    }
    function createPendingChunk(response) {
      return new Chunk("pending", null, null, response);
    }
    function wakeChunk(listeners, value) {
      for (var i = 0; i < listeners.length; i++) (0, listeners[i])(value);
    }
    function triggerErrorOnChunk(chunk, error) {
      if ("pending" !== chunk.status && "blocked" !== chunk.status)
        chunk.reason.error(error);
      else {
        var listeners = chunk.reason;
        chunk.status = "rejected";
        chunk.reason = error;
        null !== listeners && wakeChunk(listeners, error);
      }
    }
    function resolveModelChunk(chunk, value, id) {
      if ("pending" !== chunk.status)
        (chunk = chunk.reason),
          "C" === value[0]
            ? chunk.close("C" === value ? '"$undefined"' : value.slice(1))
            : chunk.enqueueModel(value);
      else {
        var resolveListeners = chunk.value,
          rejectListeners = chunk.reason;
        chunk.status = "resolved_model";
        chunk.value = value;
        chunk.reason = id;
        if (null !== resolveListeners)
          switch ((initializeModelChunk(chunk), chunk.status)) {
            case "fulfilled":
              wakeChunk(resolveListeners, chunk.value);
              break;
            case "pending":
            case "blocked":
            case "cyclic":
              if (chunk.value)
                for (value = 0; value < resolveListeners.length; value++)
                  chunk.value.push(resolveListeners[value]);
              else chunk.value = resolveListeners;
              if (chunk.reason) {
                if (rejectListeners)
                  for (value = 0; value < rejectListeners.length; value++)
                    chunk.reason.push(rejectListeners[value]);
              } else chunk.reason = rejectListeners;
              break;
            case "rejected":
              rejectListeners && wakeChunk(rejectListeners, chunk.reason);
          }
      }
    }
    function createResolvedIteratorResultChunk(response, value, done) {
      return new Chunk(
        "resolved_model",
        (done ? '{"done":true,"value":' : '{"done":false,"value":') +
          value +
          "}",
        -1,
        response
      );
    }
    function resolveIteratorResultChunk(chunk, value, done) {
      resolveModelChunk(
        chunk,
        (done ? '{"done":true,"value":' : '{"done":false,"value":') +
          value +
          "}",
        -1
      );
    }
    function loadServerReference$1(
      response,
      id,
      bound,
      parentChunk,
      parentObject,
      key
    ) {
      var serverReference = resolveServerReference(response._bundlerConfig, id);
      id = preloadModule(serverReference);
      if (bound)
        bound = Promise.all([bound, id]).then(function (_ref) {
          _ref = _ref[0];
          var fn = requireModule(serverReference);
          return fn.bind.apply(fn, [null].concat(_ref));
        });
      else if (id)
        bound = Promise.resolve(id).then(function () {
          return requireModule(serverReference);
        });
      else return requireModule(serverReference);
      bound.then(
        createModelResolver(
          parentChunk,
          parentObject,
          key,
          !1,
          response,
          createModel,
          []
        ),
        createModelReject(parentChunk)
      );
      return null;
    }
    function reviveModel(response, parentObj, parentKey, value, reference) {
      if ("string" === typeof value)
        return parseModelString(
          response,
          parentObj,
          parentKey,
          value,
          reference
        );
      if ("object" === typeof value && null !== value)
        if (
          (void 0 !== reference &&
            void 0 !== response._temporaryReferences &&
            response._temporaryReferences.set(value, reference),
          Array.isArray(value))
        )
          for (var i = 0; i < value.length; i++)
            value[i] = reviveModel(
              response,
              value,
              "" + i,
              value[i],
              void 0 !== reference ? reference + ":" + i : void 0
            );
        else
          for (i in value)
            hasOwnProperty.call(value, i) &&
              ((parentObj =
                void 0 !== reference && -1 === i.indexOf(":")
                  ? reference + ":" + i
                  : void 0),
              (parentObj = reviveModel(
                response,
                value,
                i,
                value[i],
                parentObj
              )),
              void 0 !== parentObj ? (value[i] = parentObj) : delete value[i]);
      return value;
    }
    function initializeModelChunk(chunk) {
      var prevChunk = initializingChunk,
        prevBlocked = initializingChunkBlockedModel;
      initializingChunk = chunk;
      initializingChunkBlockedModel = null;
      var rootReference =
          -1 === chunk.reason ? void 0 : chunk.reason.toString(16),
        resolvedModel = chunk.value;
      chunk.status = "cyclic";
      chunk.value = null;
      chunk.reason = null;
      try {
        var rawModel = JSON.parse(resolvedModel),
          value = reviveModel(
            chunk._response,
            { "": rawModel },
            "",
            rawModel,
            rootReference
          );
        if (
          null !== initializingChunkBlockedModel &&
          0 < initializingChunkBlockedModel.deps
        )
          (initializingChunkBlockedModel.value = value),
            (chunk.status = "blocked");
        else {
          var resolveListeners = chunk.value;
          chunk.status = "fulfilled";
          chunk.value = value;
          null !== resolveListeners && wakeChunk(resolveListeners, value);
        }
      } catch (error) {
        (chunk.status = "rejected"), (chunk.reason = error);
      } finally {
        (initializingChunk = prevChunk),
          (initializingChunkBlockedModel = prevBlocked);
      }
    }
    function reportGlobalError(response, error) {
      response._closed = !0;
      response._closedReason = error;
      response._chunks.forEach(function (chunk) {
        "pending" === chunk.status && triggerErrorOnChunk(chunk, error);
      });
    }
    function getChunk(response, id) {
      var chunks = response._chunks,
        chunk = chunks.get(id);
      chunk ||
        ((chunk = response._formData.get(response._prefix + id)),
        (chunk =
          null != chunk
            ? new Chunk("resolved_model", chunk, id, response)
            : response._closed
              ? new Chunk("rejected", null, response._closedReason, response)
              : createPendingChunk(response)),
        chunks.set(id, chunk));
      return chunk;
    }
    function createModelResolver(
      chunk,
      parentObject,
      key,
      cyclic,
      response,
      map,
      path
    ) {
      if (initializingChunkBlockedModel) {
        var blocked = initializingChunkBlockedModel;
        cyclic || blocked.deps++;
      } else
        blocked = initializingChunkBlockedModel = {
          deps: cyclic ? 0 : 1,
          value: null
        };
      return function (value) {
        for (var i = 1; i < path.length; i++) value = value[path[i]];
        parentObject[key] = map(response, value);
        "" === key &&
          null === blocked.value &&
          (blocked.value = parentObject[key]);
        blocked.deps--;
        0 === blocked.deps &&
          "blocked" === chunk.status &&
          ((value = chunk.value),
          (chunk.status = "fulfilled"),
          (chunk.value = blocked.value),
          null !== value && wakeChunk(value, blocked.value));
      };
    }
    function createModelReject(chunk) {
      return function (error) {
        return triggerErrorOnChunk(chunk, error);
      };
    }
    function getOutlinedModel(response, reference, parentObject, key, map) {
      reference = reference.split(":");
      var id = parseInt(reference[0], 16);
      id = getChunk(response, id);
      switch (id.status) {
        case "resolved_model":
          initializeModelChunk(id);
      }
      switch (id.status) {
        case "fulfilled":
          parentObject = id.value;
          for (key = 1; key < reference.length; key++)
            parentObject = parentObject[reference[key]];
          return map(response, parentObject);
        case "pending":
        case "blocked":
        case "cyclic":
          var parentChunk = initializingChunk;
          id.then(
            createModelResolver(
              parentChunk,
              parentObject,
              key,
              "cyclic" === id.status,
              response,
              map,
              reference
            ),
            createModelReject(parentChunk)
          );
          return null;
        default:
          throw id.reason;
      }
    }
    function createMap(response, model) {
      return new Map(model);
    }
    function createSet(response, model) {
      return new Set(model);
    }
    function extractIterator(response, model) {
      return model[Symbol.iterator]();
    }
    function createModel(response, model) {
      return model;
    }
    function parseTypedArray(
      response,
      reference,
      constructor,
      bytesPerElement,
      parentObject,
      parentKey
    ) {
      reference = parseInt(reference.slice(2), 16);
      reference = response._formData.get(response._prefix + reference);
      reference =
        constructor === ArrayBuffer
          ? reference.arrayBuffer()
          : reference.arrayBuffer().then(function (buffer) {
              return new constructor(buffer);
            });
      bytesPerElement = initializingChunk;
      reference.then(
        createModelResolver(
          bytesPerElement,
          parentObject,
          parentKey,
          !1,
          response,
          createModel,
          []
        ),
        createModelReject(bytesPerElement)
      );
      return null;
    }
    function resolveStream(response, id, stream, controller) {
      var chunks = response._chunks;
      stream = new Chunk("fulfilled", stream, controller, response);
      chunks.set(id, stream);
      response = response._formData.getAll(response._prefix + id);
      for (id = 0; id < response.length; id++)
        (chunks = response[id]),
          "C" === chunks[0]
            ? controller.close(
                "C" === chunks ? '"$undefined"' : chunks.slice(1)
              )
            : controller.enqueueModel(chunks);
    }
    function parseReadableStream(response, reference, type) {
      reference = parseInt(reference.slice(2), 16);
      var controller = null;
      type = new ReadableStream({
        type: type,
        start: function (c) {
          controller = c;
        }
      });
      var previousBlockedChunk = null;
      resolveStream(response, reference, type, {
        enqueueModel: function (json) {
          if (null === previousBlockedChunk) {
            var chunk = new Chunk("resolved_model", json, -1, response);
            initializeModelChunk(chunk);
            "fulfilled" === chunk.status
              ? controller.enqueue(chunk.value)
              : (chunk.then(
                  function (v) {
                    return controller.enqueue(v);
                  },
                  function (e) {
                    return controller.error(e);
                  }
                ),
                (previousBlockedChunk = chunk));
          } else {
            chunk = previousBlockedChunk;
            var _chunk = createPendingChunk(response);
            _chunk.then(
              function (v) {
                return controller.enqueue(v);
              },
              function (e) {
                return controller.error(e);
              }
            );
            previousBlockedChunk = _chunk;
            chunk.then(function () {
              previousBlockedChunk === _chunk && (previousBlockedChunk = null);
              resolveModelChunk(_chunk, json, -1);
            });
          }
        },
        close: function () {
          if (null === previousBlockedChunk) controller.close();
          else {
            var blockedChunk = previousBlockedChunk;
            previousBlockedChunk = null;
            blockedChunk.then(function () {
              return controller.close();
            });
          }
        },
        error: function (error) {
          if (null === previousBlockedChunk) controller.error(error);
          else {
            var blockedChunk = previousBlockedChunk;
            previousBlockedChunk = null;
            blockedChunk.then(function () {
              return controller.error(error);
            });
          }
        }
      });
      return type;
    }
    function asyncIterator() {
      return this;
    }
    function createIterator(next) {
      next = { next: next };
      next[ASYNC_ITERATOR] = asyncIterator;
      return next;
    }
    function parseAsyncIterable(response, reference, iterator) {
      reference = parseInt(reference.slice(2), 16);
      var buffer = [],
        closed = !1,
        nextWriteIndex = 0,
        iterable = _defineProperty({}, ASYNC_ITERATOR, function () {
          var nextReadIndex = 0;
          return createIterator(function (arg) {
            if (void 0 !== arg)
              throw Error(
                "Values cannot be passed to next() of AsyncIterables passed to Client Components."
              );
            if (nextReadIndex === buffer.length) {
              if (closed)
                return new Chunk(
                  "fulfilled",
                  { done: !0, value: void 0 },
                  null,
                  response
                );
              buffer[nextReadIndex] = createPendingChunk(response);
            }
            return buffer[nextReadIndex++];
          });
        });
      iterator = iterator ? iterable[ASYNC_ITERATOR]() : iterable;
      resolveStream(response, reference, iterator, {
        enqueueModel: function (value) {
          nextWriteIndex === buffer.length
            ? (buffer[nextWriteIndex] = createResolvedIteratorResultChunk(
                response,
                value,
                !1
              ))
            : resolveIteratorResultChunk(buffer[nextWriteIndex], value, !1);
          nextWriteIndex++;
        },
        close: function (value) {
          closed = !0;
          nextWriteIndex === buffer.length
            ? (buffer[nextWriteIndex] = createResolvedIteratorResultChunk(
                response,
                value,
                !0
              ))
            : resolveIteratorResultChunk(buffer[nextWriteIndex], value, !0);
          for (nextWriteIndex++; nextWriteIndex < buffer.length; )
            resolveIteratorResultChunk(
              buffer[nextWriteIndex++],
              '"$undefined"',
              !0
            );
        },
        error: function (error) {
          closed = !0;
          for (
            nextWriteIndex === buffer.length &&
            (buffer[nextWriteIndex] = createPendingChunk(response));
            nextWriteIndex < buffer.length;

          )
            triggerErrorOnChunk(buffer[nextWriteIndex++], error);
        }
      });
      return iterator;
    }
    function parseModelString(response, obj, key, value, reference) {
      if ("$" === value[0]) {
        switch (value[1]) {
          case "$":
            return value.slice(1);
          case "@":
            return (
              (obj = parseInt(value.slice(2), 16)), getChunk(response, obj)
            );
          case "F":
            return (
              (value = value.slice(2)),
              (value = getOutlinedModel(
                response,
                value,
                obj,
                key,
                createModel
              )),
              loadServerReference$1(
                response,
                value.id,
                value.bound,
                initializingChunk,
                obj,
                key
              )
            );
          case "T":
            if (
              void 0 === reference ||
              void 0 === response._temporaryReferences
            )
              throw Error(
                "Could not reference an opaque temporary reference. This is likely due to misconfiguring the temporaryReferences options on the server."
              );
            return createTemporaryReference(
              response._temporaryReferences,
              reference
            );
          case "Q":
            return (
              (value = value.slice(2)),
              getOutlinedModel(response, value, obj, key, createMap)
            );
          case "W":
            return (
              (value = value.slice(2)),
              getOutlinedModel(response, value, obj, key, createSet)
            );
          case "K":
            obj = value.slice(2);
            var formPrefix = response._prefix + obj + "_",
              data = new FormData();
            response._formData.forEach(function (entry, entryKey) {
              entryKey.startsWith(formPrefix) &&
                data.append(entryKey.slice(formPrefix.length), entry);
            });
            return data;
          case "i":
            return (
              (value = value.slice(2)),
              getOutlinedModel(response, value, obj, key, extractIterator)
            );
          case "I":
            return Infinity;
          case "-":
            return "$-0" === value ? -